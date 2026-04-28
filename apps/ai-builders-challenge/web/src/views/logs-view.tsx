import * as React from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type LogEntry } from "@/lib/api";
import { cn } from "@/lib/cn";

interface LogsViewProps {
  sessionId: string;
}

const EVENT_COLOR: Record<string, string> = {
  request_received: "bg-secondary text-secondary-foreground",
  retrieval: "bg-accent text-accent-foreground",
  llm_call: "bg-secondary text-secondary-foreground",
  response_sent: "bg-secondary text-secondary-foreground",
};

function entryKey(e: LogEntry) {
  return `${e.ts}|${e.event}|${e.span_id ?? ""}|${e.session_id ?? ""}`;
}

function isMismatch(e: LogEntry): boolean {
  if (e.event !== "retrieval") return false;
  if (!e.property_id || !Array.isArray(e.retrieved_ids)) return false;
  return e.retrieved_ids[0] !== e.property_id;
}

export function LogsView({ sessionId }: LogsViewProps) {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const [paused, setPaused] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [scopeToSession, setScopeToSession] = React.useState(true);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const seen = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (paused) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await api.logs(
          scopeToSession ? sessionId : undefined,
          200
        );
        if (cancelled) return;
        const next: LogEntry[] = [];
        for (const e of res.entries) {
          const key = entryKey(e);
          if (seen.current.has(key)) continue;
          seen.current.add(key);
          next.push(e);
        }
        if (next.length) {
          setEntries((prev) => [...prev, ...next].slice(-500));
        }
      } catch {
        /* swallow; show empty state */
      }
    };

    void tick();
    const interval = window.setInterval(tick, 750);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [paused, scopeToSession, sessionId]);

  // When session scope changes, reset the seen set.
  React.useEffect(() => {
    seen.current = new Set();
    setEntries([]);
  }, [sessionId, scopeToSession]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [entries.length]);

  const lower = filter.toLowerCase();
  const visible = lower
    ? entries.filter((e) => JSON.stringify(e).toLowerCase().includes(lower))
    : entries;

  const clear = () => {
    seen.current = new Set();
    setEntries([]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-6 py-3">
        <Input
          placeholder="filter text…"
          className="h-8 w-60"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={scopeToSession}
            onChange={(e) => setScopeToSession(e.target.checked)}
          />
          only session <span className="font-mono">{sessionId}</span>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">{visible.length} events</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            {paused ? "resume" : "pause"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5" />
            clear
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 font-mono text-xs">
        {visible.length === 0 ? (
          <div className="mx-auto max-w-md rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            No events yet. Send a chat message to see the agent emit logs.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {visible.map((entry) => {
              const mismatch = isMismatch(entry);
              return (
                <li
                  key={entryKey(entry)}
                  className={cn(
                    "rounded border px-3 py-2",
                    mismatch
                      ? "border-destructive/60 bg-destructive/10"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-muted-foreground">
                      {entry.ts.split("T")[1]?.replace("Z", "") ?? entry.ts}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono",
                        EVENT_COLOR[entry.event] ?? ""
                      )}
                    >
                      {entry.event}
                    </Badge>
                    {entry.session_id ? (
                      <span className="text-muted-foreground">
                        session=<span className="text-foreground">{entry.session_id}</span>
                      </span>
                    ) : null}
                    {entry.property_id ? (
                      <span className="text-muted-foreground">
                        property_id=<span className="text-foreground">{entry.property_id}</span>
                      </span>
                    ) : null}
                    {entry.retrieved_ids ? (
                      <span className="text-muted-foreground">
                        retrieved_ids=
                        <span
                          className={cn(
                            "text-foreground",
                            mismatch && "text-destructive font-semibold"
                          )}
                        >
                          [{entry.retrieved_ids.join(", ")}]
                        </span>
                      </span>
                    ) : null}
                    {typeof entry.top_score === "number" ? (
                      <span className="text-muted-foreground">
                        top_score={entry.top_score.toFixed(3)}
                      </span>
                    ) : null}
                    {typeof entry.latency_ms === "number" ? (
                      <span className="text-muted-foreground">
                        {entry.latency_ms}ms
                      </span>
                    ) : null}
                    {entry.mode ? (
                      <span className="text-muted-foreground">
                        mode={entry.mode}
                      </span>
                    ) : null}
                    {entry.span_id ? (
                      <span className="ml-auto text-muted-foreground">
                        {entry.span_id}
                      </span>
                    ) : null}
                  </div>
                  {entry.query ? (
                    <div className="mt-1 truncate text-muted-foreground">
                      query: <span className="text-foreground">{entry.query}</span>
                    </div>
                  ) : null}
                  {entry.error ? (
                    <div className="mt-1 text-destructive">{entry.error}</div>
                  ) : null}
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
    </div>
  );
}
