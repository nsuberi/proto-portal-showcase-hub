import { useRef, useEffect, useCallback, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useTerminal } from "../../hooks/useTerminal";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import VoiceIndicator from "./VoiceIndicator";
import { Terminal as TerminalIcon, Wifi, WifiOff, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { showToast } from "../ui/ToastContainer";
import "@xterm/xterm/css/xterm.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RunTab {
  id: string;
  runId: string;
  title: string;
  status: "running" | "completed" | "failed" | "cancelled";
}

// ---------------------------------------------------------------------------
// Shared xterm theme
// ---------------------------------------------------------------------------

const XTERM_THEME = {
  background: "#0d0e12",
  foreground: "#e3e2e8",
  cursor: "#bbc6e2",
  selectionBackground: "#343439",
  black: "#0d0e12",
  red: "#ffb4ab",
  green: "#a8d5ba",
  yellow: "#ffba38",
  blue: "#bbc6e2",
  magenta: "#ffb4a5",
  cyan: "#78839c",
  white: "#e3e2e8",
  brightBlack: "#44474c",
  brightRed: "#ffb4ab",
  brightGreen: "#a8d5ba",
  brightYellow: "#ffba38",
  brightBlue: "#bbc6e2",
  brightMagenta: "#ffb4a5",
  brightCyan: "#78839c",
  brightWhite: "#e3e2e8",
};

// ---------------------------------------------------------------------------
// Voice state reported by each terminal tab
// ---------------------------------------------------------------------------

interface VoiceState {
  isRecording: boolean;
  isTranscribing: boolean;
  volumeLevel: number;
  error: string | null;
}

const IDLE_VOICE: VoiceState = { isRecording: false, isTranscribing: false, volumeLevel: 0, error: null };

// ---------------------------------------------------------------------------
// RunTerminal — interactive xterm connected to a run's PTY via WebSocket
// ---------------------------------------------------------------------------

function RunTerminal({
  runId,
  isActive,
  onStatusChange,
  onVoiceState,
}: {
  runId: string;
  isActive: boolean;
  onStatusChange?: (status: "completed" | "failed") => void;
  onVoiceState?: (state: VoiceState) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [termReady, setTermReady] = useState(false);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Voice input (hold spacebar to dictate) — same as interactive terminal.
  // `ready` flips when the terminal is created so the hook re-attaches.
  const voice = useVoiceInput({ terminalRef: termRef, wsRef, ready: termReady });

  // Report voice state to parent for the shared indicator
  const onVoiceStateRef = useRef(onVoiceState);
  onVoiceStateRef.current = onVoiceState;
  useEffect(() => {
    onVoiceStateRef.current?.(voice);
  }, [voice.isRecording, voice.isTranscribing, voice.volumeLevel, voice.error]);

  // Create terminal + connect bidirectional WebSocket
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "var(--font-mono), monospace",
      theme: XTERM_THEME,
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(container);

    requestAnimationFrame(() => {
      try { fitAddon.fit(); } catch {}
    });

    termRef.current = term;
    fitRef.current = fitAddon;
    setTermReady(true);

    // Connect to run WebSocket (bidirectional — full Claude Code PTY)
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.DEV ? "localhost:8080" : location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/prototypes/research-workspace/vault/api/vault/runs/${runId}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send initial terminal dimensions
      const resizePayload = JSON.stringify({
        cols: term.cols,
        rows: term.rows,
      });
      ws.send("\x01" + resizePayload);
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.write("\r\n\x1b[90m[Session ended]\x1b[0m\r\n");
      onStatusChangeRef.current?.("completed");
    };

    ws.onerror = () => term.write("\r\n\x1b[31m[Connection error]\x1b[0m\r\n");

    // Terminal input → WebSocket → PTY
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Terminal resize → WebSocket → PTY resize
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        const resizePayload = JSON.stringify({ cols, rows });
        ws.send("\x01" + resizePayload);
      }
    });

    return () => {
      ws.close();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      wsRef.current = null;
      setTermReady(false);
    };
  }, [runId]);

  // Re-fit and focus when becoming active or when container resizes
  useEffect(() => {
    if (!isActive) return;
    const fitAndFocus = () => {
      try { fitRef.current?.fit(); } catch {}
      termRef.current?.focus();
    };
    requestAnimationFrame(fitAndFocus);

    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { fitRef.current?.fit(); } catch {}
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden px-1 py-1 ${isActive ? "" : "hidden"}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main TerminalPanel — tabbed interface
// ---------------------------------------------------------------------------

export default function TerminalPanel() {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const { terminalRef, fitAddon, isConnected, wsRef } = useTerminal(interactiveRef);
  const interactiveVoice = useVoiceInput({ terminalRef, wsRef });

  const [runTabs, setRunTabs] = useState<RunTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("interactive");

  // Track voice state from run tabs so the shared indicator works across all tabs.
  // Use state (not ref) so the indicator re-renders when the active run's voice changes.
  const [activeRunVoice, setActiveRunVoice] = useState<VoiceState>(IDLE_VOICE);
  const runVoiceStates = useRef<Map<string, VoiceState>>(new Map());

  const handleRunVoice = useCallback((tabId: string, vs: VoiceState) => {
    runVoiceStates.current.set(tabId, vs);
    // Only trigger re-render if this is the currently active tab
    if (tabId === activeTab) setActiveRunVoice(vs);
  }, [activeTab]);

  // Compute which voice state to display based on active tab
  const activeVoice = activeTab === "interactive"
    ? interactiveVoice
    : activeRunVoice;

  // Re-fit interactive terminal when active
  const handleResize = useCallback(() => {
    if (activeTab === "interactive" && fitAddon) {
      try { fitAddon.fit(); } catch {}
    }
  }, [fitAddon, activeTab]);

  useEffect(() => {
    const container = interactiveRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => requestAnimationFrame(handleResize));
    observer.observe(container);
    return () => observer.disconnect();
  }, [handleResize]);

  // Re-fit and focus interactive terminal when switching to it
  useEffect(() => {
    if (activeTab === "interactive") {
      requestAnimationFrame(() => {
        try { fitAddon?.fit(); } catch {}
        terminalRef.current?.focus();
      });
    }
    // Sync the voice indicator to the newly active tab's state
    setActiveRunVoice(runVoiceStates.current.get(activeTab) ?? IDLE_VOICE);
  }, [activeTab, fitAddon]);

  // Restore tabs for active runs on mount (e.g. after navigating away and back)
  useEffect(() => {
    const baseUrl = import.meta.env.DEV
      ? "http://localhost:8080"
      : "/prototypes/research-workspace/vault";

    fetch(`${baseUrl}/api/vault/runs`)
      .then((res) => (res.ok ? res.json() : { runs: [] }))
      .then((data) => {
        const active = (data.runs || []).filter(
          (r: { status: string }) => r.status === "running"
        );
        if (active.length > 0) {
          setRunTabs((prev) => {
            const existingIds = new Set(prev.map((t) => t.runId));
            const newTabs = active
              .filter((r: { id: string }) => !existingIds.has(r.id))
              .map((r: { id: string; title: string; status: "running" | "completed" | "failed" | "cancelled" }) => ({
                id: r.id,
                runId: r.id,
                title: r.title,
                status: r.status,
              }));
            return [...prev, ...newTabs];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Listen for run-started events from IntentionsPanel
  useEffect(() => {
    const handler = (e: Event) => {
      const { runId, title } = (e as CustomEvent).detail;
      setRunTabs((prev) => {
        // Avoid duplicating a tab that was already restored
        if (prev.some((t) => t.runId === runId)) return prev;
        return [...prev, { id: runId, runId, title, status: "running" as const }];
      });
      setActiveTab(runId); // auto-switch to the new tab
    };
    window.addEventListener("run-started", handler);
    return () => window.removeEventListener("run-started", handler);
  }, []);

  // Listen for switch-terminal-tab events (e.g. from onboarding modal)
  useEffect(() => {
    const handler = (e: Event) => {
      const { tab } = (e as CustomEvent).detail;
      setActiveTab(tab);
    };
    window.addEventListener("switch-terminal-tab", handler);
    return () => window.removeEventListener("switch-terminal-tab", handler);
  }, []);

  const updateTabStatus = useCallback((tabId: string, status: "completed" | "failed") => {
    setRunTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (tab) {
        showToast(
          status === "completed"
            ? `Finished: ${tab.title}`
            : `Run failed: ${tab.title}`,
          status === "completed" ? "success" : "error"
        );
      }
      return prev.map((t) => (t.id === tabId ? { ...t, status } : t));
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setRunTabs((prev) => prev.filter((t) => t.id !== tabId));
    runVoiceStates.current.delete(tabId);
    setActiveTab("interactive");
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="glass-header flex items-center gap-0 px-1 py-0 overflow-x-auto">
        {/* Interactive tab */}
        <button
          onClick={() => setActiveTab("interactive")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-label whitespace-nowrap border-b-2 transition-colors ${
            activeTab === "interactive"
              ? "border-primary text-white"
              : "border-transparent text-white/40 hover:text-white/60"
          }`}
        >
          <TerminalIcon className="w-3 h-3" />
          Claude
          <span className="ml-1">
            {isConnected ? (
              <Wifi className="w-2.5 h-2.5 text-domain-ml inline" />
            ) : (
              <WifiOff className="w-2.5 h-2.5 text-error/60 inline" />
            )}
          </span>
        </button>

        {/* Run tabs */}
        {runTabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-2 py-1.5 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-tertiary text-white"
                : "border-transparent text-white/40 hover:text-white/60"
            }`}
          >
            <button
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1 text-[11px] font-label whitespace-nowrap max-w-[120px]"
            >
              {tab.status === "running" ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin text-tertiary flex-shrink-0" />
              ) : tab.status === "completed" ? (
                <CheckCircle2 className="w-2.5 h-2.5 text-domain-ml flex-shrink-0" />
              ) : (
                <XCircle className="w-2.5 h-2.5 text-error/60 flex-shrink-0" />
              )}
              <span className="truncate">{tab.title}</span>
            </button>
            <button
              onClick={() => closeTab(tab.id)}
              className="p-0.5 text-white/20 hover:text-white/50 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}

        {/* Voice indicator (pushed right) — shows state from whichever tab is active */}
        <div className="ml-auto pr-2">
          <VoiceIndicator
            isRecording={activeVoice.isRecording}
            isTranscribing={activeVoice.isTranscribing}
            volumeLevel={activeVoice.volumeLevel}
            error={activeVoice.error}
          />
        </div>
      </div>

      {/* Terminal panels — all stay mounted, toggle visibility */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={interactiveRef}
          className={`absolute inset-0 px-1 py-1 ${
            activeTab === "interactive" ? "" : "hidden"
          }`}
        />
        {runTabs.map((tab) => (
          <RunTerminal
            key={tab.id}
            runId={tab.runId}
            isActive={activeTab === tab.id}
            onVoiceState={(vs) => handleRunVoice(tab.id, vs)}
            onStatusChange={(status) => updateTabStatus(tab.id, status)}
          />
        ))}
      </div>
    </div>
  );
}
