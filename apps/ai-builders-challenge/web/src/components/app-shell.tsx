import * as React from "react";
import { Sidebar, type NavItem } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/cn";

interface AppShellProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  codeHash: string | null;
  children: React.ReactNode;
  headerSubtitle?: string;
}

const STORAGE_KEY = "borrower-agent.sidebar-collapsed";

export function AppShell({
  items,
  activeId,
  onSelect,
  sessionId,
  onSessionChange,
  codeHash,
  headerSubtitle,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className="flex h-full w-full bg-background text-foreground">
      <Sidebar
        items={items}
        activeId={activeId}
        collapsed={collapsed}
        onSelect={onSelect}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className={cn("flex min-w-0 flex-1 flex-col")}>
        <Header
          title={activeItem?.label ?? "borrower-agent"}
          subtitle={headerSubtitle ?? activeItem?.description}
          sessionId={sessionId}
          onSessionChange={onSessionChange}
          codeHash={codeHash}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
