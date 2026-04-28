import { useState } from "react";
import { useChatContext } from "../../contexts/ChatContext";
import {
  FileText,
  Terminal,
  Search,
  Pencil,
  Loader2,
  Activity,
  ChevronRight,
  Globe,
} from "lucide-react";

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
  WebFetch: Globe,
  WebSearch: Globe,
};

function formatToolInput(
  tool: string,
  description: string,
): { summary: string; detail: string | null } {
  // The description already has a human-readable summary.
  // Extract more detail from the description for the expanded view.
  const parts = description.split(" ");
  if (tool === "Read" || tool === "Write" || tool === "Edit") {
    const filePath = parts.slice(1).join(" ");
    return { summary: description, detail: filePath || null };
  }
  if (tool === "Bash") {
    return { summary: "Running command", detail: null };
  }
  if (tool === "Glob" || tool === "Grep") {
    const pattern = parts.slice(-1)[0];
    return { summary: description, detail: pattern || null };
  }
  return { summary: description, detail: null };
}

function ToolCallItem({
  tool,
  description,
  isLatest,
  isStreaming,
}: {
  tool: string;
  description: string;
  isLatest: boolean;
  isStreaming: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[tool] || Terminal;
  const { summary, detail } = formatToolInput(tool, description);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left ${
          isLatest && isStreaming
            ? "bg-primary/8 border border-primary/15"
            : expanded
              ? "bg-on-surface/[0.04]"
              : "bg-on-surface/[0.02] hover:bg-on-surface/[0.04]"
        }`}
      >
        <Icon
          className={`w-3 h-3 flex-shrink-0 ${
            isLatest && isStreaming
              ? "text-primary"
              : "text-on-surface-variant/40"
          }`}
        />
        <span
          className={`font-label text-[10px] truncate flex-1 ${
            isLatest && isStreaming
              ? "text-on-surface/80"
              : "text-on-surface-variant/60"
          }`}
        >
          {summary}
        </span>
        <ChevronRight
          className={`w-2.5 h-2.5 text-on-surface-variant/25 transition-transform flex-shrink-0 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="ml-7 mr-2 mt-1 mb-1.5 px-2.5 py-2 rounded bg-on-surface/[0.02] border border-outline-variant/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider w-10 flex-shrink-0">
                Tool
              </span>
              <span className="font-mono text-[10px] text-primary/70">
                {tool}
              </span>
            </div>
            {detail && (
              <div className="flex items-start gap-2">
                <span className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider w-10 flex-shrink-0 pt-0.5">
                  Path
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant/60 break-all">
                  {detail}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider w-10 flex-shrink-0">
                Desc
              </span>
              <span className="font-label text-[10px] text-on-surface-variant/50">
                {description}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityPanel() {
  const { messages, isStreaming } = useChatContext();

  // Collect tool uses from the current streaming message
  const lastMessage = messages[messages.length - 1];
  const currentTools =
    lastMessage?.role === "assistant" ? lastMessage.toolUses || [] : [];

  // Also collect recent tool uses from previous assistant messages (last 4)
  const recentMessages = messages
    .filter(
      (m) => m.role === "assistant" && m.toolUses && m.toolUses.length > 0,
    )
    .slice(-4);

  if (
    !isStreaming &&
    currentTools.length === 0 &&
    recentMessages.length === 0
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Activity className="w-8 h-8 text-on-surface-variant/15 mb-2" />
        <p className="font-label text-xs text-on-surface-variant/40">
          No agent activity yet. Tool calls will appear here when the Gardener
          is working.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Current streaming activity */}
      {isStreaming && currentTools.length > 0 && (
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="font-label text-xs font-medium text-primary">
              Working...
            </span>
            <span className="font-label text-[9px] text-on-surface-variant/40 ml-auto">
              {currentTools.length} calls
            </span>
          </div>
          <div className="space-y-1">
            {currentTools.map((tu, i) => (
              <ToolCallItem
                key={i}
                tool={tu.tool}
                description={tu.description}
                isLatest={i === currentTools.length - 1}
                isStreaming={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent activity from previous messages */}
      {recentMessages.map((msg, msgIdx) => (
        <div
          key={msg.id}
          className={`px-4 py-3 ${msgIdx < recentMessages.length - 1 ? "border-b border-outline-variant/10" : ""}`}
        >
          <span className="font-label text-[9px] text-on-surface-variant/40 uppercase tracking-wider">
            {msg.toolUses!.length} tool calls
          </span>
          <div className="space-y-0.5 mt-1">
            {msg.toolUses!.map((tu, i) => (
              <ToolCallItem
                key={i}
                tool={tu.tool}
                description={tu.description}
                isLatest={false}
                isStreaming={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
