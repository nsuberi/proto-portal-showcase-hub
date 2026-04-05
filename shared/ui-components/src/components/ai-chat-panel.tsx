import * as React from "react"
import { X, Send } from "lucide-react"
import { cn } from "../lib/utils"

/**
 * AI assistant chat panel — Codecademy slide-out pattern.
 * Conversational AI with message history + input.
 *
 * Curriculum: AI Design Principles (conversational, help me understand,
 *             cognitive load, human in the loop, context engineering)
 */

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface AIChatPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onClose?: () => void
  isLoading?: boolean
  placeholder?: string
}

const AIChatPanel = React.forwardRef<HTMLDivElement, AIChatPanelProps>(
  ({
    title = "AI Learning Assistant",
    messages, onSendMessage, onClose, isLoading,
    placeholder = "Send a message",
    className, ...props
  }, ref) => {
    const [input, setInput] = React.useState("")
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim())
        setInput("")
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full border-l border-border bg-card",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
          <h3 className="text-sm font-semibold text-primary">{title}</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "text-sm leading-relaxed",
                msg.role === "user" && "ml-8"
              )}
            >
              <div className={cn(
                "rounded-lg px-3 py-2.5",
                msg.role === "user"
                  ? "bg-primary/10 text-foreground"
                  : "bg-muted text-foreground"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    )
  }
)
AIChatPanel.displayName = "AIChatPanel"

export { AIChatPanel }
