import * as React from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, type ChatResult, type Property } from "@/lib/api";
import { cn } from "@/lib/cn";

interface ChatTurn {
  role: "user" | "agent";
  text: string;
  meta?: {
    requested: string;
    retrieved: string;
    spanId: string;
  };
}

interface ChatViewProps {
  sessionId: string;
  properties: Property[];
  propertyId: string;
  onPropertyChange: (id: string) => void;
}

export function ChatView({
  sessionId,
  properties,
  propertyId,
  onPropertyChange,
}: ChatViewProps) {
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const selectedProperty = properties.find((p) => p.property_id === propertyId);

  const send = async () => {
    const text = draft.trim();
    if (!text || !propertyId) return;
    setDraft("");
    setError(null);
    setTurns((t) => [...t, { role: "user", text }]);
    setSending(true);
    try {
      const result: ChatResult = await api.chat(sessionId, propertyId, text);
      setTurns((t) => [
        ...t,
        {
          role: "agent",
          text: result.answer,
          meta: {
            requested: result.requested_property_id,
            retrieved: result.retrieved_property_id,
            spanId: result.span_id,
          },
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            property
          </label>
          <select
            value={propertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>
                {p.property_id} — {p.address}
              </option>
            ))}
          </select>
          {selectedProperty ? (
            <div className="text-xs text-muted-foreground">
              appraised ${selectedProperty.appraised_value.toLocaleString()} ·
              built {selectedProperty.year_built}
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setTurns([])}
            disabled={turns.length === 0}
          >
            clear
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {turns.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ask the borrower-agent a question about the selected property.
            Watch the <span className="font-semibold">Logs</span> view to see
            how the agent retrieves context and compare the{" "}
            <span className="font-mono">requested</span> vs{" "}
            <span className="font-mono">retrieved</span> property ids.
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-4">
            {turns.map((turn, i) => (
              <li
                key={i}
                className={cn(
                  "flex flex-col gap-1",
                  turn.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm shadow-sm",
                    turn.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border border-border"
                  )}
                >
                  {turn.text}
                </div>
                {turn.meta ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {turn.meta.spanId}
                    </Badge>
                    <span className="font-mono">
                      requested {turn.meta.requested}
                    </span>
                    <span className="font-mono">→</span>
                    <Badge
                      variant={
                        turn.meta.requested === turn.meta.retrieved
                          ? "outline"
                          : "destructive"
                      }
                      className="font-mono"
                    >
                      retrieved {turn.meta.retrieved}
                    </Badge>
                    {turn.meta.requested !== turn.meta.retrieved ? (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        mismatch
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      {error ? (
        <div className="border-t border-destructive bg-destructive/10 px-6 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <div className="shrink-0 border-t border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Input
            placeholder="What's my appraised value?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={sending || !propertyId}
          />
          <Button
            onClick={() => void send()}
            disabled={sending || !draft.trim() || !propertyId}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            send
          </Button>
        </div>
      </div>
    </div>
  );
}
