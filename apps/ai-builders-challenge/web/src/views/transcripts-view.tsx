import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type TranscriptSummary, type TranscriptTurn } from "@/lib/api";
import { cn } from "@/lib/cn";

export function TranscriptsView() {
  const [sessions, setSessions] = React.useState<TranscriptSummary[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const [turns, setTurns] = React.useState<TranscriptTurn[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    api
      .transcripts()
      .then((res) => {
        setSessions(res.sessions);
        if (res.sessions[0]) setActive(res.sessions[0].session_id);
      })
      .catch(() => setSessions([]));
  }, []);

  React.useEffect(() => {
    if (!active) return;
    setLoading(true);
    api
      .transcript(active)
      .then((res) => setTurns(res.turns))
      .catch(() => setTurns([]))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-border bg-background">
        <div className="sticky top-0 border-b border-border bg-background px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          sessions
        </div>
        <ul>
          {sessions.map((s) => (
            <li key={s.session_id}>
              <button
                type="button"
                onClick={() => setActive(s.session_id)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent",
                  active === s.session_id && "bg-secondary"
                )}
              >
                <span className="font-mono text-sm">{s.session_id}</span>
                <span className="text-xs text-muted-foreground">
                  {s.property_id ?? "—"} · {s.turn_count} turns
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
        {!active ? (
          <div className="text-sm text-muted-foreground">
            Select a transcript to read it.
          </div>
        ) : loading ? (
          <div className="text-sm text-muted-foreground">loading…</div>
        ) : (
          <Card className="mx-auto max-w-3xl">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-mono">{active}</CardTitle>
              {turns[0]?.property_id ? (
                <Badge variant="secondary" className="font-mono">
                  {turns[0].property_id}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {turns.map((t) => (
                  <li
                    key={`${t.session_id}-${t.turn}`}
                    className={cn(
                      "flex flex-col gap-1",
                      t.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm",
                        t.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {t.text}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      turn {t.turn} · {t.role}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
