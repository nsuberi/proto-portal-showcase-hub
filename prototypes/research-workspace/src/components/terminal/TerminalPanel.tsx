import { useRef, useEffect, useCallback, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useTerminal } from "../../hooks/useTerminal";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import VoiceIndicator from "./VoiceIndicator";
import { Terminal as TerminalIcon, Wifi, WifiOff, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
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
// RunTerminal — a read-only xterm connected to a run's WebSocket
// ---------------------------------------------------------------------------

function RunTerminal({
  runId,
  isActive,
  onStatusChange,
}: {
  runId: string;
  isActive: boolean;
  onStatusChange?: (status: "completed" | "failed") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Create terminal + connect WebSocket
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: false,
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

    // Connect to run WebSocket
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.DEV ? "localhost:8080" : location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/prototypes/research-workspace/vault/api/vault/runs/${runId}/ws`;

    const ws = new WebSocket(wsUrl);
    let lastMessage = "";
    ws.onmessage = (event) => {
      term.write(event.data);
      lastMessage = event.data;
    };
    ws.onclose = () => {
      term.write("\r\n\x1b[90m[Disconnected]\x1b[0m\r\n");
      // Detect final status from the last message the server sent
      if (lastMessage.includes("[Run completed]")) {
        onStatusChangeRef.current?.("completed");
      } else if (lastMessage.includes("[Run failed]") || lastMessage.includes("[Run cancelled]")) {
        onStatusChangeRef.current?.("failed");
      } else {
        onStatusChangeRef.current?.("completed");
      }
    };
    ws.onerror = () => term.write("\r\n\x1b[31m[Connection error]\x1b[0m\r\n");

    return () => {
      ws.close();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [runId]);

  // Re-fit when becoming active or when container resizes
  useEffect(() => {
    if (!isActive) return;
    const fit = () => {
      try { fitRef.current?.fit(); } catch {}
    };
    requestAnimationFrame(fit);

    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => requestAnimationFrame(fit));
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
  const { isRecording, isTranscribing, volumeLevel, error } = useVoiceInput({
    terminalRef,
    wsRef,
  });

  const [runTabs, setRunTabs] = useState<RunTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("interactive");

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

  // Re-fit interactive terminal when switching to it
  useEffect(() => {
    if (activeTab === "interactive") {
      requestAnimationFrame(() => {
        try { fitAddon?.fit(); } catch {}
      });
    }
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

  const updateTabStatus = useCallback((tabId: string, status: "completed" | "failed") => {
    setRunTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, status } : t))
    );
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setRunTabs((prev) => prev.filter((t) => t.id !== tabId));
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

        {/* Voice indicator (pushed right) */}
        <div className="ml-auto pr-2">
          <VoiceIndicator
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            volumeLevel={volumeLevel}
            error={error}
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
            onStatusChange={(status) => updateTabStatus(tab.id, status)}
          />
        ))}
      </div>
    </div>
  );
}
