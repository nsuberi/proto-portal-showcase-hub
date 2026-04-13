import { useState, useEffect, useRef, useMemo } from "react";
import {
  Activity,
  FileText,
  Terminal,
  Search,
  Pencil,
  Globe,
  Shield,
  Trash2,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";

interface ToolEvent {
  timestamp: string;
  tool: string;
  input: Record<string, unknown>;
  decision: "allow" | "block";
  runId?: string;
  runTitle?: string;
}

interface Run {
  id: string;
  title: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  toolCount: number;
  intentionId: string | null;
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
  WebFetch: Globe,
  WebSearch: Globe,
  Agent: Activity,
};

const TOOL_COLORS: Record<string, string> = {
  Read: "text-primary",
  Write: "text-tertiary",
  Edit: "text-tertiary",
  Bash: "text-secondary",
  Glob: "text-white/60",
  Grep: "text-white/60",
  WebFetch: "text-domain-ml",
  WebSearch: "text-domain-ml",
};

function summarizeInput(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case "Read":
    case "Write":
    case "Edit":
      return `${input.file_path || ""}`;
    case "Bash":
      return `${(input.command as string || "").slice(0, 60)}`;
    case "Glob":
    case "Grep":
      return `${input.pattern || ""}`;
    case "WebFetch":
      return `${input.url || ""}`;
    case "WebSearch":
      return `${input.query || ""}`;
    default:
      return Object.keys(input).slice(0, 2).join(", ") || "";
  }
}

function RunStatusBadge({ run, onStop, onSelect, isSelected }: { run: Run; onStop: () => void; onSelect: () => void; isSelected: boolean }) {
  const elapsed = run.finishedAt
    ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
    : Math.round((Date.now() - new Date(run.startedAt).getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer ${
        isSelected ? "bg-primary/[0.08] border-l-2 border-l-primary" : ""
      }`}
    >
      {run.status === "running" ? (
        <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
      ) : run.status === "completed" ? (
        <CheckCircle2 className="w-3 h-3 text-domain-ml flex-shrink-0" />
      ) : (
        <XCircle className="w-3 h-3 text-error/60 flex-shrink-0" />
      )}
      <span className="font-label text-[10px] text-white/70 truncate flex-1">
        {run.title}
      </span>
      <span className="font-mono text-[9px] text-white/25">{timeStr}</span>
      <span className="font-label text-[9px] text-white/30">{run.toolCount} tools</span>
      {run.status === "running" && (
        <span
          onClick={(e) => { e.stopPropagation(); onStop(); }}
          className="p-0.5 text-white/30 hover:text-error transition-colors"
          title="Stop run"
        >
          <Square className="w-2.5 h-2.5" />
        </span>
      )}
    </button>
  );
}

function EventRow({ event }: { event: ToolEvent }) {
  const Icon = TOOL_ICONS[event.tool] || Activity;
  const color = TOOL_COLORS[event.tool] || "text-white/50";
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const summary = summarizeInput(event.tool, event.input);

  return (
    <div className="flex items-center gap-2 px-3 py-1 hover:bg-white/[0.02] transition-colors">
      <span className="font-mono text-[9px] text-white/25 w-14 flex-shrink-0">
        {time}
      </span>
      <span className={`flex items-center gap-1 font-label text-[10px] ${color} w-16 flex-shrink-0`}>
        <Icon className="w-3 h-3" />
        {event.tool}
      </span>
      <span className="font-mono text-[10px] text-white/40 truncate flex-1">
        {summary}
      </span>
      <span
        className={`font-label text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
          event.decision === "allow"
            ? "bg-domain-ml/10 text-domain-ml/70"
            : "bg-error/10 text-error/70"
        }`}
      >
        {event.decision === "allow" ? "ok" : "blocked"}
      </span>
    </div>
  );
}

export default function ToolActivityPanel() {
  const [events, setEvents] = useState<ToolEvent[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [polling, setPolling] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Poll activity log + runs
  useEffect(() => {
    if (!polling) return;

    const poll = async () => {
      try {
        const [actRes, runRes] = await Promise.all([
          fetch(`${BASE_URL}/api/vault/activity`),
          fetch(`${BASE_URL}/api/vault/runs`),
        ]);
        if (actRes.ok) {
          const data = await actRes.json();
          setEvents(data.events || []);
        }
        if (runRes.ok) {
          const data = await runRes.json();
          setRuns(data.runs || []);
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [polling]);

  // Filter events by selected session
  const filteredEvents = useMemo(() => {
    if (!selectedRunId) return events;
    return events.filter((e) => e.runId === selectedRunId);
  }, [events, selectedRunId]);

  // Auto-scroll on new events
  useEffect(() => {
    if (filteredEvents.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = filteredEvents.length;
  }, [filteredEvents.length]);

  const clearLog = async () => {
    setEvents([]);
    await fetch(`${BASE_URL}/api/vault/activity`, { method: "DELETE" }).catch(() => {});
  };

  const stopRun = async (id: string) => {
    await fetch(`${BASE_URL}/api/vault/runs/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const activeCount = runs.filter((r) => r.status === "running").length;

  // Tool summary counts for the filtered view
  const toolCounts = filteredEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.tool] = (acc[e.tool] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-header flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-on-surface-variant/60" />
            <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
              Hooks &amp; Activity
            </span>
          </div>
          {activeCount > 0 && (
            <span className="flex items-center gap-1 font-label text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              {activeCount} running
            </span>
          )}
          {filteredEvents.length > 0 && activeCount === 0 && (
            <span className="font-label text-[9px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
              {filteredEvents.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPolling(!polling)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-label transition-colors ${
              polling
                ? "text-domain-ml bg-domain-ml/10"
                : "text-white/30 bg-white/[0.04]"
            }`}
          >
            {polling ? "Live" : "Paused"}
          </button>
          <button
            onClick={clearLog}
            className="p-0.5 text-white/30 hover:text-error transition-colors"
            title="Clear log"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sessions list — click a session to filter, click again to deselect */}
      {runs.length > 0 && (
        <div className="border-b border-white/[0.06]">
          {selectedRunId && (
            <button
              onClick={() => setSelectedRunId(null)}
              className="flex items-center gap-1.5 w-full px-3 py-1 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]"
            >
              <Layers className="w-3 h-3 text-white/30" />
              <span className="font-label text-[10px] text-white/40">
                Show all sessions
              </span>
            </button>
          )}
          {runs.slice(0, 8).map((run) => (
            <RunStatusBadge
              key={run.id}
              run={run}
              isSelected={run.id === selectedRunId}
              onSelect={() => setSelectedRunId(run.id === selectedRunId ? null : run.id)}
              onStop={() => stopRun(run.id)}
            />
          ))}
        </div>
      )}

      {/* Tool summary bar */}
      {Object.keys(toolCounts).length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-1 border-b border-white/[0.04]">
          {Object.entries(toolCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([tool, count]) => {
              const Icon = TOOL_ICONS[tool] || Activity;
              const color = TOOL_COLORS[tool] || "text-white/50";
              return (
                <span
                  key={tool}
                  className={`inline-flex items-center gap-0.5 font-label text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] ${color}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {tool}
                  <span className="text-white/30 ml-0.5">{count}</span>
                </span>
              );
            })}
        </div>
      )}

      {/* Event stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 && runs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Shield className="w-8 h-8 text-white/10 mb-2" />
            <p className="font-label text-[10px] text-white/25">
              PreToolUse hooks log tool activity here.
            </p>
            <p className="font-label text-[10px] text-white/15 mt-1">
              Click the play button on an intention to run it.
            </p>
          </div>
        )}
        {filteredEvents.length === 0 && selectedRunId && runs.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Activity className="w-6 h-6 text-white/10 mb-2" />
            <p className="font-label text-[10px] text-white/25">
              No tool activity yet for this session.
            </p>
          </div>
        )}
        {filteredEvents.map((event, i) => (
          <EventRow key={`${event.timestamp}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}
