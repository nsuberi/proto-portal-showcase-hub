import type { ReactNode } from "react";

export interface AppShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function AppShell({
  sidebar,
  children,
  side = "left",
  className,
}: AppShellProps) {
  const layoutClass = side === "right" ? "flex-row-reverse" : "";
  return (
    <div
      className={`flex ${layoutClass} h-full w-full overflow-hidden ${className ?? ""}`.trim()}
    >
      <aside className="flex-shrink-0 h-full">{sidebar}</aside>
      <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}

export interface ScrollViewportProps {
  children: ReactNode;
  className?: string;
}

export function ScrollViewport({ children, className }: ScrollViewportProps) {
  return (
    <div
      className={`flex-1 min-h-0 min-w-0 overflow-y-auto ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
