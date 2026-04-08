import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Calendar, FolderKanban, LogOut, Settings, Map,
} from "lucide-react";
import { Button } from "@proto-portal/ui-components";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/path", icon: Map, label: "AI Builder Path" },
  { to: "/catalog", icon: BookOpen, label: "Catalog" },
  { to: "/events", icon: Calendar, label: "Events" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
];

export default function BrowseLayout({ showSidebar = true }: { showSidebar?: boolean }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navbar — warm cream */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              <span className="border border-foreground rounded px-1.5 py-0.5 text-sm font-mono mr-1">cd</span>
              Code Dojo
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {(user?.role === "admin" || user?.role === "instructor") && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className={showSidebar && isAuthenticated ? "grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-8" : ""}>
          {/* Sidebar — Codecademy left nav pattern */}
          {showSidebar && isAuthenticated && (
            <aside className="hidden lg:block">
              <nav className="flex flex-col gap-0.5 py-2">
                {NAV_ITEMS.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors border-l-[3px] ${
                        active
                          ? "border-primary font-semibold text-foreground bg-muted/30"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          )}

          {/* Main content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
