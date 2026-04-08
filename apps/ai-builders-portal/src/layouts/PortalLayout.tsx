import { Outlet, Link, useLocation } from "react-router-dom";
import { GALAXY_BG_URL } from "@/design-system/tokens";

const navItems = [
  { path: "/", label: "Home", icon: "explore" },
  { path: "/challenges", label: "Challenges", icon: "architecture" },
  { path: "/showcase", label: "Showcase", icon: "interests" },
  { path: "/community", label: "Community", icon: "forum" },
  { path: "/profile", label: "Profile", icon: "account_circle" },
];

export default function PortalLayout() {
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-surface">
      {/* Galaxy background — fixed behind all content */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface-container-lowest" />
        <img
          src={GALAXY_BG_URL}
          alt=""
          className="h-full w-full object-cover opacity-40 mix-blend-screen"
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col items-center py-8 md:flex bg-surface-container-low">
        <div className="mb-12">
          <Link to="/" className="text-lg font-black tracking-tighter text-on-surface font-headline">
            AB
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-xl p-3 transition-all duration-300 ${
                isActive(item.path)
                  ? "bg-surface-container-highest text-tertiary"
                  : "text-on-primary-container hover:bg-surface-container-highest hover:text-primary"
              }`}
              title={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </Link>
          ))}
        </div>
        <div className="mt-auto">
          <span className="block -rotate-90 font-label text-[10px] uppercase tracking-widest text-on-primary-container">
            PORTAL
          </span>
        </div>
      </aside>

      {/* Top header bar (frosted glass) */}
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:left-20 bg-surface/70 backdrop-blur-xl font-headline tracking-wide">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tighter text-on-surface md:hidden">
            AI Builders
          </span>
          <span className="hidden text-xl font-bold tracking-tighter text-on-surface md:block">
            AI Builders Portal
          </span>
          <div className="mx-2 hidden h-4 w-px bg-outline-variant/30 md:block" />
          <span className="hidden font-label text-[10px] uppercase tracking-[0.2em] text-tertiary/80 md:block">
            Community of Practice
          </span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-colors duration-300 text-sm ${
                isActive(item.path)
                  ? "text-tertiary border-b-2 border-tertiary pb-1"
                  : "text-on-surface/60 hover:text-tertiary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/profile"
            className="text-on-surface/60 hover:text-tertiary transition-colors duration-200"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-10 min-h-screen pt-[72px] pb-24 md:pb-0 md:ml-20">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[2rem] px-4 pb-6 pt-2 md:hidden bg-surface/80 backdrop-blur-2xl">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-transform active:scale-90 ${
              isActive(item.path)
                ? "bg-surface-container-highest text-tertiary"
                : "text-on-primary-container"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
