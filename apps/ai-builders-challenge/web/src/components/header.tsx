import * as React from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  codeHash: string | null;
}

export function Header({
  title,
  subtitle,
  sessionId,
  onSessionChange,
  codeHash,
}: HeaderProps) {
  const [draft, setDraft] = React.useState(sessionId);
  React.useEffect(() => setDraft(sessionId), [sessionId]);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        {subtitle ? (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="session-input">
          session
        </label>
        <Input
          id="session-input"
          className="h-8 w-40 font-mono text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft && onSessionChange(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft) {
              onSessionChange(draft);
              (e.target as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
        />
      </div>

      <Badge variant="outline" className="font-mono">
        code_hash: {codeHash ?? "—"}
      </Badge>
    </header>
  );
}
