import { useState } from "react";
import type { ToolCall } from "../../types/tool-calls";
import RiskIndicator from "./RiskIndicator";
import {
  FileText,
  PenLine,
  FileDiff,
  TerminalSquare,
  Search,
  FolderSearch,
  Globe,
  Bot,
  Sparkles,
  Activity,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Icon + color mappings
// ---------------------------------------------------------------------------

const TOOL_ICONS: Record<string, LucideIcon> = {
  Read: FileText,
  Write: PenLine,
  Edit: FileDiff,
  Bash: TerminalSquare,
  Glob: FolderSearch,
  Grep: Search,
  WebFetch: Globe,
  WebSearch: Globe,
  Agent: Bot,
  Skill: Sparkles,
};

const TOOL_COLORS: Record<string, string> = {
  Read: "text-primary",
  Write: "text-tertiary",
  Edit: "text-tertiary",
  Bash: "text-secondary",
  Glob: "text-white/60",
  Grep: "text-white/60",
  WebFetch: "text-accent-success",
  WebSearch: "text-accent-success",
  Agent: "text-primary",
  Skill: "text-tertiary",
};

// ---------------------------------------------------------------------------
// Detail field (reused from existing ToolActivityPanel pattern)
// ---------------------------------------------------------------------------

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-0.5">
      <span className="font-label text-[9px] text-white/30 w-16 flex-shrink-0 text-right">
        {label}
      </span>
      <span
        className={`text-[10px] text-white/60 break-all flex-1 ${
          mono ? "font-mono" : "font-label"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool-specific detail rendering (ported from ToolActivityPanel)
// ---------------------------------------------------------------------------

function renderToolDetails(tool: string, input: Record<string, unknown>) {
  switch (tool) {
    case "Skill":
      return (
        <>
          <DetailField label="Skill" value={String(input.skill || "")} />
          {input.args && (
            <DetailField label="Args" value={String(input.args)} mono />
          )}
        </>
      );
    case "Agent":
      return (
        <>
          {input.description && (
            <DetailField label="Task" value={String(input.description)} />
          )}
          {input.subagent_type && (
            <DetailField label="Type" value={String(input.subagent_type)} />
          )}
          {input.prompt && (
            <DetailField
              label="Prompt"
              value={
                String(input.prompt).length > 300
                  ? String(input.prompt).slice(0, 300) + "…"
                  : String(input.prompt)
              }
            />
          )}
        </>
      );
    case "Read":
      return (
        <>
          <DetailField
            label="File"
            value={String(input.file_path || "")}
            mono
          />
          {input.offset != null && (
            <DetailField label="Offset" value={`Line ${input.offset}`} mono />
          )}
          {input.limit != null && (
            <DetailField
              label="Limit"
              value={`${input.limit} lines`}
              mono
            />
          )}
        </>
      );
    case "Write":
      return (
        <>
          <DetailField
            label="File"
            value={String(input.file_path || "")}
            mono
          />
          {input.content && (
            <DetailField
              label="Content"
              value={
                String(input.content).length > 200
                  ? `${String(input.content).slice(0, 200)}… (${String(input.content).length} chars)`
                  : String(input.content)
              }
              mono
            />
          )}
        </>
      );
    case "Edit":
      return (
        <>
          <DetailField
            label="File"
            value={String(input.file_path || "")}
            mono
          />
          {input.old_string && (
            <DetailField
              label="Replace"
              value={
                String(input.old_string).length > 120
                  ? String(input.old_string).slice(0, 120) + "…"
                  : String(input.old_string)
              }
              mono
            />
          )}
          {input.new_string && (
            <DetailField
              label="With"
              value={
                String(input.new_string).length > 120
                  ? String(input.new_string).slice(0, 120) + "…"
                  : String(input.new_string)
              }
              mono
            />
          )}
          {input.replace_all && (
            <DetailField label="Mode" value="Replace all occurrences" />
          )}
        </>
      );
    case "Bash":
      return (
        <DetailField
          label="Command"
          value={String(input.command || "")}
          mono
        />
      );
    case "Glob":
      return (
        <>
          <DetailField
            label="Pattern"
            value={String(input.pattern || "")}
            mono
          />
          {input.path && (
            <DetailField label="Path" value={String(input.path)} mono />
          )}
        </>
      );
    case "Grep":
      return (
        <>
          <DetailField
            label="Pattern"
            value={String(input.pattern || "")}
            mono
          />
          {input.path && (
            <DetailField label="Path" value={String(input.path)} mono />
          )}
          {input.glob && (
            <DetailField label="Glob" value={String(input.glob)} mono />
          )}
        </>
      );
    case "WebFetch":
      return (
        <DetailField label="URL" value={String(input.url || "")} mono />
      );
    case "WebSearch":
      return <DetailField label="Query" value={String(input.query || "")} />;
    default: {
      const entries = Object.entries(input);
      if (entries.length === 0)
        return <DetailField label="Input" value="(none)" />;
      return (
        <>
          {entries.slice(0, 6).map(([key, val]) => (
            <DetailField
              key={key}
              label={key}
              value={typeof val === "string" ? val : JSON.stringify(val)}
              mono
            />
          ))}
          {entries.length > 6 && (
            <DetailField
              label=""
              value={`… +${entries.length - 6} more fields`}
            />
          )}
        </>
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Status icon
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: ToolCall["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
    case "completed":
      return (
        <CheckCircle2 className="w-3 h-3 text-accent-success tool-call-complete-icon" />
      );
    case "failed":
      return <XCircle className="w-3 h-3 text-error/70" />;
    case "blocked":
      return <ShieldX className="w-3 h-3 text-error/70" />;
    case "pending":
      return (
        <span className="w-3 h-3 rounded-full border border-white/20" />
      );
  }
}

// ---------------------------------------------------------------------------
// Format duration
// ---------------------------------------------------------------------------

function formatDuration(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// ToolCallCard
// ---------------------------------------------------------------------------

export default function ToolCallCard({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[call.tool] || Activity;
  const color = TOOL_COLORS[call.tool] || "text-white/50";

  const time = new Date(call.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const statusClass =
    call.status === "running"
      ? "tool-call-running"
      : call.status === "blocked" || call.status === "failed"
        ? "tool-call-failed-border"
        : "";

  return (
    <div
      className={`tool-call-card tool-call-enter ${statusClass} ${
        expanded ? "bg-white/[0.03]" : ""
      }`}
      data-status={call.status}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer"
      >
        <ChevronRight
          className={`w-2.5 h-2.5 text-white/20 flex-shrink-0 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <span className="font-mono text-[9px] text-white/25 w-14 flex-shrink-0">
          {time}
        </span>
        <span
          className={`flex items-center gap-1 ${color} w-[18px] flex-shrink-0`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="font-body text-[11px] text-white/50 truncate flex-1">
          {call.description}
        </span>
        {call.durationMs != null && call.status === "completed" && (
          <span className="font-mono text-[9px] text-white/20 flex-shrink-0">
            {formatDuration(call.durationMs)}
          </span>
        )}
        <RiskIndicator level={call.riskLevel} />
        <StatusIcon status={call.status} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="pl-[68px] pr-3 pb-2 pt-0.5 border-b border-white/[0.04]">
          {renderToolDetails(call.tool, call.input)}
          <div className="flex gap-2 py-0.5 mt-0.5">
            <span className="font-label text-[9px] text-white/30 w-16 flex-shrink-0 text-right">
              Decision
            </span>
            <span
              className={`font-label text-[10px] font-medium ${
                call.decision === "allow"
                  ? "text-accent-success/80"
                  : "text-error/80"
              }`}
            >
              {call.decision === "allow" ? "Allowed" : "Blocked"}
            </span>
          </div>
          {call.decision === "block" && call.reason && (
            <DetailField label="Reason" value={call.reason} />
          )}
        </div>
      )}
    </div>
  );
}
