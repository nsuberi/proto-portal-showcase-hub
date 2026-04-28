import * as React from "react";
import { AlertTriangle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type BehavioralSignals } from "@/lib/api";
import { cn } from "@/lib/cn";

interface Row extends BehavioralSignals {
  session_id: string;
}

function tone(sat: number) {
  if (sat >= 0.8) return "ok";
  if (sat >= 0.5) return "warn";
  return "bad";
}

export function BehavioralView() {
  const [rows, setRows] = React.useState<Row[]>([]);

  React.useEffect(() => {
    api
      .behavioral()
      .then((data) => {
        const next = Object.entries(data)
          .map(([session_id, signals]) => ({ session_id, ...signals }))
          .sort((a, b) => a.satisfaction_proxy - b.satisfaction_proxy);
        setRows(next);
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 text-sm text-muted-foreground">
        Signals captured per session. Sorted by satisfaction proxy ascending —
        the sessions most worth investigating are at the top.
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const t = tone(row.satisfaction_proxy);
          return (
            <Card key={row.session_id}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-mono">{row.session_id}</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    {row.property_id}
                  </div>
                </div>
                <Badge
                  variant={
                    t === "ok" ? "secondary" : t === "warn" ? "warn" : "destructive"
                  }
                  className="flex items-center gap-1"
                >
                  {t === "ok" ? (
                    <ThumbsUp className="h-3 w-3" />
                  ) : (
                    <ThumbsDown className="h-3 w-3" />
                  )}
                  sat {(row.satisfaction_proxy * 100).toFixed(0)}%
                </Badge>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <dt className="text-muted-foreground">retrievals</dt>
                  <dd className="font-mono text-right">{row.retrieval_count}</dd>

                  <dt className="text-muted-foreground">repeated qs</dt>
                  <dd
                    className={cn(
                      "font-mono text-right",
                      row.repeated_question_rate > 0.25 && "text-destructive"
                    )}
                  >
                    {(row.repeated_question_rate * 100).toFixed(0)}%
                  </dd>

                  <dt className="text-muted-foreground">avg latency</dt>
                  <dd className="font-mono text-right">
                    {row.avg_turn_latency_ms} ms
                  </dd>

                  <dt className="text-muted-foreground">abandoned</dt>
                  <dd className="text-right">
                    {row.abandonment_flag ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">no</span>
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
