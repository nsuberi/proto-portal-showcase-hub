import React, { useEffect, useMemo, useState } from "react";
import { Box, Static, Text, useApp, useInput, useStdout } from "ink";
import type { Session } from "../session.js";
import type { SessionEvent, ClarifyRequestPayload, PermissionRequestPayload } from "./events.js";
import { TranscriptView } from "./components/TranscriptView.js";
import { StatusBar } from "./components/StatusBar.js";
import { InputBox } from "./components/InputBox.js";
import { Mascot, type MascotState } from "./components/Mascot.js";
import { PermissionPrompt } from "./components/PermissionPrompt.js";
import { ClarifyPrompt } from "./components/ClarifyPrompt.js";
import { computeViewport } from "./viewport.js";
import { theme } from "./theme.js";

interface AppProps {
  session: Session;
  modelLabel: string;
  maxTurns: number;
  showMascot: boolean;
}

type Pending =
  | { kind: "permission"; payload: PermissionRequestPayload }
  | { kind: "clarify"; payload: ClarifyRequestPayload }
  | null;

export function App({ session, modelLabel, maxTurns, showMascot }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(session.modeName);
  const [doneFlash, setDoneFlash] = useState(false);

  // Browse-mode state: when true, the InputBox is replaced by a hint and
  // arrow keys navigate the transcript's tool cards instead of typing.
  const [browseMode, setBrowseMode] = useState(false);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Re-render when the terminal is resized so the viewport adapts.
  const [, setResizeTick] = useState(0);
  useEffect(() => {
    if (!stdout) return;
    const handler = () => setResizeTick((t) => t + 1);
    stdout.on("resize", handler);
    return () => {
      stdout.off("resize", handler);
    };
  }, [stdout]);

  useEffect(() => {
    const handler = (event: SessionEvent) => {
      setEvents((prev) => [...prev, event]);
      switch (event.type) {
        case "permission-request":
          setPending({ kind: "permission", payload: event.payload });
          break;
        case "clarify-request":
          setPending({ kind: "clarify", payload: event.payload });
          break;
        case "turn-started":
          setBusy(true);
          break;
        case "tool-result":
          setBusy(true);
          break;
        case "stop":
          setBusy(false);
          setDoneFlash(true);
          setTimeout(() => setDoneFlash(false), 1200);
          break;
        case "mode-changed":
          setMode(event.mode);
          break;
        case "session-end":
          exit();
          break;
        default:
          break;
      }
    };
    session.on("event", handler);
    return () => {
      session.off("event", handler);
    };
  }, [session, exit]);

  // Ordered list of expandable tool-call IDs (skip `finish` — already full-text).
  const toolIds = useMemo(() => {
    const out: string[] = [];
    for (const e of events) {
      if (e.type === "tool-call" && e.call.name !== "finish") out.push(e.call.id);
    }
    return out;
  }, [events]);

  // Drop the cursor when leaving browse mode.
  useEffect(() => {
    if (!browseMode) setCursorId(null);
  }, [browseMode]);

  useInput((input, key) => {
    if (key.ctrl && (input === "c" || input === "d")) {
      session.exit();
      return;
    }

    // Esc toggles browse mode (only when no modal prompt is up).
    if (key.escape && !pending) {
      if (browseMode) {
        setBrowseMode(false);
      } else if (toolIds.length > 0) {
        setBrowseMode(true);
        setCursorId(toolIds[toolIds.length - 1]);
      }
      return;
    }

    if (!browseMode) return;

    if (key.upArrow) {
      const idx = cursorId ? toolIds.indexOf(cursorId) : -1;
      const next = idx <= 0 ? toolIds[0] : toolIds[idx - 1];
      setCursorId(next);
    } else if (key.downArrow) {
      const idx = cursorId ? toolIds.indexOf(cursorId) : -1;
      const next = idx === -1 || idx >= toolIds.length - 1 ? toolIds[toolIds.length - 1] : toolIds[idx + 1];
      setCursorId(next);
    } else if (key.return || input === " ") {
      if (!cursorId) return;
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(cursorId)) next.delete(cursorId);
        else next.add(cursorId);
        return next;
      });
    } else if (input === "e") {
      // 'e' toggles all-expand for convenience
      setExpanded((prev) => (prev.size === toolIds.length ? new Set() : new Set(toolIds)));
    }
  });

  const state: MascotState = pending ? "idle" : busy ? "thinking" : doneFlash ? "done" : "idle";

  const onPermissionDecide = (answer: "allow" | "always-allow" | "deny") => {
    if (pending?.kind !== "permission") return;
    session.respond(pending.payload.id, answer);
    setPending(null);
  };

  const onClarifyAnswer = (ids: string[]) => {
    if (pending?.kind !== "clarify") return;
    session.respond(pending.payload.id, ids);
    setPending(null);
  };

  // Bound the rendered transcript to fit the terminal so Ink's redraw never
  // overflows the viewport. Without this, a tall transcript causes the OS
  // terminal to scroll on every keystroke, which feels like the cursor
  // "snapping back to the bottom" when navigating with arrows.
  const cols = stdout?.columns ?? 100;
  const rows = stdout?.rows ?? 24;
  // Reserve space for: banner (~5 if shown), status bar (2), input/hint (2),
  // hidden-marker padding (2), and a small margin.
  const reserved = (showMascot ? 5 : 0) + 7;
  const transcriptRows = Math.max(8, rows - reserved);

  const cursorIndex = cursorId
    ? events.findIndex((e) => e.type === "tool-call" && e.call.id === cursorId)
    : null;
  const viewport = computeViewport({
    events,
    expanded,
    cursorIndex: cursorIndex !== null && cursorIndex >= 0 ? cursorIndex : null,
    rows: transcriptRows,
    cols,
  });
  const visibleEvents = events.slice(viewport.start, viewport.end);

  return (
    <Box flexDirection="column">
      {showMascot ? (
        <Static items={[0]}>{() => <Mascot key="banner" variant="banner" state="idle" />}</Static>
      ) : null}

      <TranscriptView
        events={visibleEvents}
        expanded={expanded}
        cursorId={cursorId}
        hiddenAbove={viewport.hiddenAbove}
        hiddenBelow={viewport.hiddenBelow}
      />

      <StatusBar
        mode={mode}
        model={modelLabel}
        turn={session.currentTurnNumber}
        maxTurns={maxTurns}
        state={state}
        showMascot={showMascot}
      />

      <Box marginTop={1}>
        {pending?.kind === "permission" ? (
          <PermissionPrompt payload={pending.payload} onDecide={onPermissionDecide} />
        ) : pending?.kind === "clarify" ? (
          <ClarifyPrompt payload={pending.payload} onAnswer={onClarifyAnswer} />
        ) : browseMode ? (
          <Text color={theme.muted}>
            [browse]  ↑↓ select tool card · enter/space toggle · e expand-all · esc return
          </Text>
        ) : busy ? (
          <Box flexDirection="column">
            <Text color={theme.muted}>(souschef is working — your next message will queue)</Text>
            {toolIds.length > 0 ? (
              <Text color={theme.muted}>(press esc to browse / expand tool calls)</Text>
            ) : null}
          </Box>
        ) : (
          <Box flexDirection="column">
            <InputBox onSubmit={(text) => session.sendUserMessage(text)} />
            {toolIds.length > 0 ? (
              <Text color={theme.muted}>esc to browse / expand tool calls</Text>
            ) : null}
          </Box>
        )}
      </Box>
    </Box>
  );
}
