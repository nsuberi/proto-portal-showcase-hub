import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Wifi, WifiOff, FileText, Terminal, Search, Pencil, ExternalLink, KeyRound, Sprout, Compass, Merge, Leaf, Activity } from "lucide-react";
import { useChatContext } from "../../contexts/ChatContext";
import type { ChatMessage } from "../../hooks/useChat";
import MarkdownRenderer from "../MarkdownRenderer";

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

function MessageBubble({
  message,
  isStreaming,
  isLastAssistant,
  onViewActivity,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  isLastAssistant: boolean;
  onViewActivity?: () => void;
}) {
  const isUser = message.role === "user";
  const hasToolUses = message.toolUses && message.toolUses.length > 0;

  // Show the most recent tool use as a compact status line while streaming
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
        <span className="font-label text-[10px] sm:text-xs font-medium text-on-surface-variant/60 mb-0.5 sm:mb-1 block">
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
            <span className="font-label text-xs text-on-surface-variant/60">Thinking...</span>
          </div>
        ) : null}

        {/* Streaming tool status — show current tool as a compact line */}
        {isStreaming && latestTool && LatestToolIcon && (
          <div className="flex items-center gap-1.5 mt-1.5 py-1">
            <LatestToolIcon className="w-3 h-3 text-primary/60" />
            <span className="font-label text-[11px] text-on-surface-variant/50">
              {latestTool.description}
            </span>
            {hasToolUses && message.toolUses!.length > 1 && (
              <span className="font-label text-[9px] text-on-surface-variant/30 ml-1">
                +{message.toolUses!.length - 1} more
              </span>
            )}
          </div>
        )}

        {/* After streaming completes — show "View activity" button if there were tool uses */}
        {!isStreaming && !isUser && hasToolUses && (
          <button
            onClick={onViewActivity}
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-on-surface/[0.03] hover:bg-on-surface/[0.06] border border-outline-variant/20 transition-colors cursor-pointer"
          >
            <Activity className="w-3 h-3 text-on-surface-variant/40" />
            <span className="font-label text-[10px] text-on-surface-variant/50">
              View agent activity
            </span>
            <span className="font-label text-[9px] text-on-surface-variant/30">
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

function AuthPrompt({ authUrl, isAuthenticating, onStartAuth, onSubmitCode }: {
  authUrl: string | null;
  isAuthenticating: boolean;
  onStartAuth: () => void;
  onSubmitCode: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [urlOpened, setUrlOpened] = useState(false);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmitCode(code.trim());
      setCode("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center mb-4">
        <KeyRound className="w-6 h-6 text-tertiary" />
      </div>
      <h3 className="font-headline text-lg text-on-surface mb-2">
        Connect Claude
      </h3>

      {!isAuthenticating && !authUrl ? (
        <>
          <p className="font-body text-sm text-on-surface-variant/60 max-w-sm mb-4">
            Claude needs to be connected to your Anthropic account to work. This is a one-time setup.
          </p>
          <button
            onClick={onStartAuth}
            className="inline-flex items-center gap-2 font-label text-sm px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            Connect Claude
          </button>
        </>
      ) : authUrl && !urlOpened ? (
        <>
          <p className="font-body text-sm text-on-surface-variant/60 max-w-sm mb-4">
            Step 1: Sign in with your Anthropic account.
          </p>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setUrlOpened(true)}
            className="inline-flex items-center gap-2 font-label text-sm px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Sign in to Anthropic
          </a>
        </>
      ) : authUrl && urlOpened ? (
        <>
          <p className="font-body text-sm text-on-surface-variant/60 max-w-sm mb-4">
            Step 2: Paste the code from the Anthropic page below.
          </p>
          <form onSubmit={handleSubmitCode} className="flex gap-2 w-full max-w-sm">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code here..."
              autoFocus
              className="flex-1 bg-surface-bright border border-outline-variant/40 rounded-lg px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="inline-flex items-center gap-1.5 font-label text-sm px-4 py-2.5 rounded-lg bg-primary text-on-primary disabled:opacity-30 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-label text-xs text-on-surface-variant/40 hover:text-on-surface-variant/60 transition-colors mt-3"
          >
            <ExternalLink className="w-3 h-3" />
            Reopen sign-in page
          </a>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="font-label text-sm text-on-surface-variant/60">Starting auth flow...</span>
        </div>
      )}
    </div>
  );
}

interface ChatPanelProps {
  onOpenActivity?: () => void;
}

export default function ChatPanel({ onOpenActivity }: ChatPanelProps) {
  const { messages, isStreaming, isConnected, authUrl, isAuthenticating, sendMessage, startAuth, submitAuthCode } = useChatContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0;
  const showAuth = authUrl || isAuthenticating;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Auth state takes over the full view
  if (showAuth) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <AuthPrompt authUrl={authUrl} isAuthenticating={isAuthenticating} onStartAuth={startAuth} onSubmitCode={submitAuthCode} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages / welcome area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Welcome state — centered heading, input below via the shared input area */
          <div className="flex flex-col items-center justify-center h-full text-center px-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-5">
              <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h2 className="font-headline text-xl sm:text-2xl text-on-surface mb-1.5 sm:mb-2">
              What would you like to explore?
            </h2>
            <p className="font-body text-sm text-on-surface-variant/60 max-w-md">
              Tell me what you want to learn about. I'll help you grow your knowledge tree with research, connections, and insights.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
                isLastAssistant={msg.role === "assistant" && idx === messages.length - 1}
                onViewActivity={onOpenActivity}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area — always pinned at bottom */}
      <div className="border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-sm pb-safe">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3"
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
              className="flex-1 resize-none bg-surface-bright border-1.5 border-outline-variant/40 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all disabled:opacity-50 max-h-32"
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || !isConnected}
              className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-primary text-on-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:bg-primary/80 transition-colors shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
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

        {/* Suggestion chips — shown only on empty state, below the input */}
        {isEmpty && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestionSend(s.label)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all group"
                >
                  <s.icon className={`w-3.5 h-3.5 ${s.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="font-label text-xs text-on-surface-variant/70 group-hover:text-on-surface transition-colors">
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
