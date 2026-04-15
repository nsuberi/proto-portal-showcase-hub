import { useState } from "react";
import { loadConversationDetail } from "../../hooks/useConversations";
import { useConversationsContext } from "../../contexts/ConversationsContext";
import type { ConversationSummary, ConversationDetail } from "../../types/conversation";
import {
  MessageCircle,
  GitBranch,
  Leaf,
  Flower2,
  TreeDeciduous,
  Wrench,
  ArrowLeft,
  FileText,
  Terminal,
  Search,
  Pencil,
  Clock,
  ChevronRight,
} from "lucide-react";
import MarkdownRenderer from "../MarkdownRenderer";

// ---------------------------------------------------------------------------
// Tool icon mapping
// ---------------------------------------------------------------------------

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Tree node badge
// ---------------------------------------------------------------------------

function TreeBadge({
  type,
  count,
}: {
  type: "branch" | "leaf" | "flower" | "root";
  count: number;
}) {
  if (count === 0) return null;
  const config = {
    branch: { icon: GitBranch, color: "text-branch", bg: "bg-branch/10" },
    leaf: { icon: Leaf, color: "text-leaf", bg: "bg-leaf/10" },
    flower: { icon: Flower2, color: "text-flower", bg: "bg-flower/10" },
    root: { icon: TreeDeciduous, color: "text-root", bg: "bg-root/10" },
  }[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-label text-[9px] ${config.color} ${config.bg}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Conversation card (list item)
// ---------------------------------------------------------------------------

function ConversationCard({
  conversation,
  onSelect,
}: {
  conversation: ConversationSummary;
  onSelect: () => void;
}) {
  const nodes = conversation.treeNodes;
  const hasTreeNodes =
    nodes.branchIds.length +
      nodes.leafIds.length +
      nodes.flowerIds.length +
      nodes.rootIds.length >
    0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 border-b border-outline-variant/15 hover:bg-on-surface/[0.02] active:bg-on-surface/[0.04] transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageCircle className="w-4 h-4 text-primary/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-label text-sm text-on-surface font-medium truncate flex-1">
              {conversation.title}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="font-label text-[10px] text-on-surface-variant/40 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
            <span className="font-label text-[10px] text-on-surface-variant/30">
              {conversation.messageCount} messages
            </span>
            {conversation.toolUseCount > 0 && (
              <span className="font-label text-[10px] text-primary/50 flex items-center gap-0.5">
                <Wrench className="w-2.5 h-2.5" />
                {conversation.toolUseCount}
              </span>
            )}
          </div>

          {/* Tree associations */}
          {hasTreeNodes && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              <TreeBadge type="root" count={nodes.rootIds.length} />
              <TreeBadge type="branch" count={nodes.branchIds.length} />
              <TreeBadge type="leaf" count={nodes.leafIds.length} />
              <TreeBadge type="flower" count={nodes.flowerIds.length} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Conversation detail view
// ---------------------------------------------------------------------------

function ConversationDetailView({
  detail,
  onBack,
}: {
  detail: ConversationDetail;
  onBack: () => void;
}) {
  const [showTools, setShowTools] = useState(false);
  const td = detail.treeDetails;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/20 shrink-0">
        <button
          onClick={onBack}
          className="p-1 -ml-1 rounded-lg hover:bg-on-surface/[0.04] active:bg-on-surface/[0.06] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface-variant/60" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-label text-sm font-medium text-on-surface truncate">
            {detail.title}
          </p>
          <p className="font-label text-[10px] text-on-surface-variant/40">
            {new Date(detail.createdAt).toLocaleString()} &middot;{" "}
            {detail.messages.length} messages
          </p>
        </div>
      </div>

      {/* Tree associations panel */}
      {(td.branches.length > 0 ||
        td.leaves.length > 0 ||
        td.flowers.length > 0 ||
        td.roots.length > 0) && (
        <div className="px-4 py-3 border-b border-outline-variant/15 bg-surface-container-lowest/50 shrink-0">
          <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant/40 mb-2">
            Knowledge Tree
          </p>
          <div className="space-y-1.5">
            {td.roots.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <TreeDeciduous className="w-3 h-3 text-root flex-shrink-0" />
                <span className="text-on-surface/70">{r.label}</span>
                <span className="text-on-surface-variant/30 font-label text-[9px]">
                  root
                </span>
              </div>
            ))}
            {td.branches.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <GitBranch className="w-3 h-3 text-branch flex-shrink-0" />
                <span className="text-on-surface/70">{b.title}</span>
                <span className="text-on-surface-variant/30 font-label text-[9px]">
                  {b.status}
                </span>
              </div>
            ))}
            {td.leaves.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <Leaf className="w-3 h-3 text-leaf flex-shrink-0" />
                <span className="text-on-surface/70 truncate">
                  {l.summary}
                </span>
              </div>
            ))}
            {td.flowers.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <Flower2 className="w-3 h-3 text-flower flex-shrink-0" />
                <span className="text-on-surface/70 truncate">
                  {f.insight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool audit toggle */}
      {detail.toolUses.length > 0 && (
        <button
          onClick={() => setShowTools(!showTools)}
          className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/15 hover:bg-on-surface/[0.02] transition-colors text-left shrink-0"
        >
          <Wrench className="w-3.5 h-3.5 text-primary/50" />
          <span className="font-label text-xs text-on-surface-variant/60 flex-1">
            {detail.toolUses.length} tool calls
          </span>
          <ChevronRight
            className={`w-3 h-3 text-on-surface-variant/30 transition-transform ${showTools ? "rotate-90" : ""}`}
          />
        </button>
      )}

      {showTools && (
        <div className="px-4 py-2 border-b border-outline-variant/15 bg-surface-container-lowest/30">
          {detail.toolUses.map((tu, i) => {
            const Icon = TOOL_ICONS[tu.tool] || Terminal;
            return (
              <div
                key={i}
                className="flex items-center gap-2 py-1 text-[10px]"
              >
                <Icon className="w-2.5 h-2.5 text-on-surface-variant/40 flex-shrink-0" />
                <span className="font-label text-on-surface-variant/60 flex-1 truncate">
                  {tu.tool}
                  {tu.input?.file_path
                    ? `: ${String(tu.input.file_path).split("/").pop()}`
                    : tu.input?.pattern
                      ? `: ${tu.input.pattern}`
                      : tu.input?.command
                        ? `: ${String(tu.input.command).slice(0, 40)}`
                        : ""}
                </span>
                <span className="text-on-surface-variant/30 font-mono">
                  {new Date(tu.timestamp).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
          {detail.messages.map((msg, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex-shrink-0 mt-1">
                {msg.role === "user" ? (
                  <div className="w-6 h-6 rounded-full bg-tertiary/15 flex items-center justify-center">
                    <span className="font-label text-[10px] text-tertiary font-medium">
                      Y
                    </span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/12 flex items-center justify-center">
                    <Leaf className="w-3 h-3 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="font-label text-[10px] font-medium text-on-surface-variant/50 mb-0.5 block">
                  {msg.role === "user" ? "You" : "Gardener"}
                </span>
                {msg.role === "user" ? (
                  <p className="font-body text-sm text-on-surface whitespace-pre-wrap">
                    {msg.content}
                  </p>
                ) : (
                  <div className="text-sm [&_.prose]:text-sm [&_.prose_p]:my-1.5">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}
                {msg.toolUses && msg.toolUses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {msg.toolUses.map((tu, j) => {
                      const Icon = TOOL_ICONS[tu.tool] || Terminal;
                      return (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 font-label text-[9px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary/60"
                        >
                          <Icon className="w-2 h-2" />
                          {tu.tool}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main history component
// ---------------------------------------------------------------------------

export default function ConversationHistory({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { conversations, loading } = useConversationsContext();
  const [selectedDetail, setSelectedDetail] =
    useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSelect = async (conv: ConversationSummary) => {
    setLoadingDetail(true);
    const detail = await loadConversationDetail(conv.id);
    if (detail) setSelectedDetail(detail);
    setLoadingDetail(false);
  };

  // Show detail view
  if (selectedDetail) {
    return (
      <ConversationDetailView
        detail={selectedDetail}
        onBack={() => setSelectedDetail(null)}
      />
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-label text-sm text-on-surface-variant/40">
          Loading conversations...
        </span>
      </div>
    );
  }

  // Empty
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="w-12 h-12 text-on-surface-variant/15 mb-3" />
        <h3 className="font-headline text-lg text-on-surface-variant/50 mb-1">
          No conversations yet
        </h3>
        <p className="font-body text-sm text-on-surface-variant/40 max-w-sm">
          Start chatting with the Gardener. Your conversation history will appear
          here with tree associations and tool audit trails.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 font-label text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Start a conversation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/20 shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -ml-1 rounded-lg hover:bg-on-surface/[0.04] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface-variant/60" />
          </button>
        )}
        <h3 className="font-label text-sm font-semibold text-on-surface flex-1">
          Conversation History
        </h3>
        <span className="font-label text-[10px] text-on-surface-variant/40 bg-on-surface/[0.04] px-2 py-0.5 rounded-full">
          {conversations.length}
        </span>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loadingDetail && (
          <div className="flex items-center justify-center py-8">
            <span className="font-label text-xs text-on-surface-variant/40">
              Loading conversation...
            </span>
          </div>
        )}
        {!loadingDetail &&
          conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              onSelect={() => handleSelect(conv)}
            />
          ))}
      </div>
    </div>
  );
}
