import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Wifi, WifiOff, FileText, Terminal, Search, Pencil, Sprout, Compass, Merge, Leaf, Activity, AlertTriangle, Coins } from "lucide-react";
import { useChatContext } from "../../contexts/ChatContext";
import type { ChatMessage, QuotaState, QuotaBlockReason } from "../../hooks/useChat";
import MarkdownRenderer from "../MarkdownRenderer";

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

const BLOCK_MESSAGES: Record<QuotaBlockReason, string> = {
  not_allowed: "This demo is invite-only — your account isn't on the allowlist.",
  daily_runs: "You've used all your runs for today. The limit resets at 00:00 UTC.",
  daily_budget: "You've reached your daily budget for today. It resets at 00:00 UTC.",
  org_budget: "The demo is at capacity for today. Please try again tomorrow.",
  concurrent: "Please wait for your current run to finish before starting another.",
  error: "Couldn't check your usage limit right now. Please try again in a moment.",
};

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `$${n.toFixed(2)}`;
}

function MessageBubble({
  message,
  isStreaming,
  onViewActivity,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  onViewActivity?: () => void;
}) {
  const isUser = message.role === "user";
  const hasToolUses = message.toolUses && message.toolUses.length > 0;

  const latestTool = hasToolUses ? message.toolUses![message.toolUses!.length - 1] : null;
  const LatestToolIcon = latestTool ? (TOOL_ICONS[latestTool.tool] || Terminal) : null;

  return (
    <div className="flex gap-2.5 sm:gap-3">
      {/* Role indicator */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tertiary/15 flex items-center justify-center">
            <span className="font-label text-[10px] sm:text-xs text-tertiary font-medium">Y</span>
          </div>
        ) : (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/12 flex items-center justify-center">
            <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <span className="font-label text-[10px] sm:text-xs font-medium text-on-surface-variant/80 mb-0.5 sm:mb-1 block">
          {isUser ? "You" : "Gardener"}
        </span>

        {isUser ? (
          <p className="font-body text-sm text-on-surface whitespace-pre-wrap">{message.content}</p>
        ) : message.content ? (
          <div className="text-sm [&_.prose]:text-sm [&_.prose_p]:my-1.5 [&_.prose_pre]:my-2 [&_.prose_ul]:my-1.5 [&_.prose_ol]:my-1.5">
            <MarkdownRenderer content={message.content} />
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="font-label text-xs text-on-surface-variant/80">Thinking...</span>
          </div>
        ) : null}

        {/* Streaming tool status */}
        {isStreaming && latestTool && LatestToolIcon && (
          <div className="flex items-center gap-1.5 mt-1.5 py-1">
            <LatestToolIcon className="w-3 h-3 text-primary/60" />
            <span className="font-label text-[11px] text-on-surface-variant/72">
              {latestTool.description}
            </span>
            {hasToolUses && message.toolUses!.length > 1 && (
              <span className="font-label text-[9px] text-on-surface-variant/60 ml-1">
                +{message.toolUses!.length - 1} more
              </span>
            )}
          </div>
        )}

        {/* "View activity" button */}
        {!isUser && hasToolUses && (
          <button
            onClick={onViewActivity}
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-on-surface/[0.03] hover:bg-on-surface/[0.06] border border-outline-variant/20 transition-colors cursor-pointer"
          >
            <Activity className="w-3 h-3 text-on-surface-variant/65" />
            <span className="font-label text-[10px] text-on-surface-variant/72">
              View agent activity
            </span>
            <span className="font-label text-[9px] text-on-surface-variant/60">
              {message.toolUses!.length} calls
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Sprout, label: "Connect my experience to a new field", color: "text-primary" },
  { icon: Search, label: "Explore a research topic in depth", color: "text-leaf" },
  { icon: Merge, label: "Synthesize what I've learned", color: "text-branch" },
  { icon: Compass, label: "What should I explore next?", color: "text-tertiary" },
];

// Per-user budget banner. Surfaces remaining $ / runs, the last run's cost, a
// near-limit warning, and a clear block message when the quota gate rejects.
function QuotaBar({ quota }: { quota: QuotaState }) {
  const { remainingUsd, remainingRuns, perRunCapUsd, usdPerDay, lastCostUsd, blocked } = quota;

  if (blocked) {
    return (
      <div className="mx-3 sm:mx-4 mb-2 px-3 py-2 rounded-lg bg-error/[0.08] border border-error/20 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-error/80 mt-0.5 flex-shrink-0" />
        <span className="font-label text-[11px] text-error/90 leading-relaxed">
          {BLOCK_MESSAGES[blocked]}
        </span>
      </div>
    );
  }

  // Nothing to show until we have at least one number.
  if (remainingUsd === null && remainingRuns === null) return null;

  const lowBudget = perRunCapUsd !== null && remainingUsd !== null && remainingUsd < (perRunCapUsd || 0) + 0.001;
  const lowRuns = remainingRuns !== null && remainingRuns <= 1;
  const near = lowBudget || lowRuns;

  return (
    <div
      className={`mx-3 sm:mx-4 mb-2 px-3 py-1.5 rounded-lg border flex items-center gap-2 flex-wrap ${
        near
          ? "bg-tertiary/[0.08] border-tertiary/25"
          : "bg-on-surface/[0.03] border-outline-variant/20"
      }`}
    >
      <Coins className={`w-3 h-3 flex-shrink-0 ${near ? "text-tertiary" : "text-on-surface-variant/65"}`} />
      <span className="font-label text-[10px] text-on-surface-variant/80">
        {fmtUsd(remainingUsd)}
        {usdPerDay ? <span className="text-on-surface-variant/65"> of {fmtUsd(usdPerDay)}</span> : null} left today
      </span>
      {remainingRuns !== null && (
        <span className="font-label text-[10px] text-on-surface-variant/72">
          · {remainingRuns} run{remainingRuns === 1 ? "" : "s"} left
        </span>
      )}
      {lastCostUsd !== null && (
        <span className="font-label text-[10px] text-on-surface-variant/65 ml-auto">
          last run: ${lastCostUsd.toFixed(4)}
        </span>
      )}
      {near && lastCostUsd === null && (
        <span className="font-label text-[10px] text-tertiary/80 ml-auto">
          {lowRuns ? "last run today" : "low budget"}
        </span>
      )}
    </div>
  );
}

interface ChatPanelProps {
  onOpenActivity?: () => void;
}

export default function ChatPanel({ onOpenActivity }: ChatPanelProps) {
  const { messages, isStreaming, isConnected, quota, sendMessage } = useChatContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pendingSentRef = useRef(false);
  useEffect(() => {
    if (pendingSentRef.current || !isConnected) return;
    const pending = sessionStorage.getItem("rw:pendingIntent");
    if (pending) {
      pendingSentRef.current = true;
      sessionStorage.removeItem("rw:pendingIntent");
      sendMessage(pending);
    }
  }, [isConnected, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSuggestionSend = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages / welcome area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 sm:mb-6">
              <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl text-on-surface mb-2 sm:mb-3">
              What would you like to explore?
            </h2>
            <p className="font-body text-base sm:text-lg text-on-surface-variant/85 max-w-md">
              Tell me what you want to learn about. I'll help you grow your knowledge tree with research, connections, and insights.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
                onViewActivity={onOpenActivity}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area — always pinned at bottom */}
      <div className="border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-sm pb-safe">
        <div className="max-w-2xl mx-auto pt-2.5 sm:pt-3">
          <QuotaBar quota={quota} />
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto px-3 sm:px-4 pb-2.5 sm:pb-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "What would you like to explore?" : "Connecting..."}
              disabled={!isConnected}
              rows={1}
              className="flex-1 resize-none bg-surface-bright border-1.5 border-outline-variant/40 rounded-xl px-4 py-3 font-body text-base text-on-surface placeholder:text-on-surface-variant/65 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all disabled:opacity-50 max-h-40"
              style={{ minHeight: "52px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || !isConnected}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:bg-primary/80 transition-colors shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Connection status */}
          <div className={`items-center gap-1.5 mt-1.5 ml-1 ${isConnected ? "hidden sm:flex" : "flex"}`}>
            {isConnected ? (
              <Wifi className="w-2.5 h-2.5 text-accent-success" />
            ) : (
              <WifiOff className="w-2.5 h-2.5 text-error/60" />
            )}
            <span className={`font-label text-[10px] ${isConnected ? "text-accent-success/60" : "text-error/50"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </form>

        {/* Suggestion chips — shown only on empty state */}
        {isEmpty && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestionSend(s.label)}
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all group"
                >
                  <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="font-label text-sm text-on-surface-variant/80 group-hover:text-on-surface transition-colors">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
