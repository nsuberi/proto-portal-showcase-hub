import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Wifi, WifiOff, FileText, Terminal, Search, Pencil, ExternalLink, KeyRound } from "lucide-react";
import { useChat, type ChatMessage } from "../../hooks/useChat";
import MarkdownRenderer from "../MarkdownRenderer";

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

function ToolUseBadge({ tool, description }: { tool: string; description: string }) {
  const Icon = TOOL_ICONS[tool] || Terminal;
  return (
    <span className="inline-flex items-center gap-1 font-label text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/60">
      <Icon className="w-2.5 h-2.5" />
      {description}
    </span>
  );
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-primary/15 text-on-surface rounded-2xl rounded-br-sm px-4 py-2.5"
            : "bg-surface-container text-on-surface rounded-2xl rounded-bl-sm px-4 py-2.5"
        }`}
      >
        {isUser ? (
          <p className="font-body text-sm whitespace-pre-wrap">{message.content}</p>
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

        {message.toolUses && message.toolUses.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.toolUses.map((tu, i) => (
              <ToolUseBadge key={i} tool={tu.tool} description={tu.description} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeMessage({ onStartAuth }: { onStartAuth: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-2xl">&#x2728;</span>
      </div>
      <h3 className="font-headline text-lg text-on-surface mb-2">
        Research Assistant
      </h3>
      <p className="font-body text-sm text-on-surface-variant/60 max-w-sm mb-4">
        Ask me to explore your vault, draft insights, analyze papers, or edit files. I have full access to your workspace.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {[
          "What files are in my vault?",
          "Summarize README.md",
          "Draft an insight about KV caching",
        ].map((suggestion) => (
          <span
            key={suggestion}
            className="font-label text-xs px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant/70 cursor-default"
          >
            {suggestion}
          </span>
        ))}
      </div>
      <button
        onClick={onStartAuth}
        className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant/40 hover:text-on-surface-variant/60 transition-colors"
      >
        <KeyRound className="w-3 h-3" />
        First time? Connect Claude
      </button>
    </div>
  );
}

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
              className="flex-1 bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
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

export default function ChatPanel() {
  const { messages, isStreaming, isConnected, authUrl, isAuthenticating, sendMessage, startAuth, submitAuthCode } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
    // Re-focus input
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline-variant/20 bg-surface-container-low/50">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">&#x2728;</span>
          <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
            Claude
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-domain-ml" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-error/60" />
          )}
          <span
            className={`font-label text-xs ${
              isConnected ? "text-domain-ml" : "text-error/60"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {authUrl || isAuthenticating ? (
          <AuthPrompt authUrl={authUrl} isAuthenticating={isAuthenticating} onStartAuth={startAuth} onSubmitCode={submitAuthCode} />
        ) : messages.length === 0 ? (
          <WelcomeMessage onStartAuth={startAuth} />
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === "assistant"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-outline-variant/20 p-2 bg-surface-container-low/30"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask Claude anything..." : "Connecting..."}
            disabled={!isConnected}
            rows={1}
            className="flex-1 resize-none bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 max-h-32"
            style={{ minHeight: "38px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming || !isConnected}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-on-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
