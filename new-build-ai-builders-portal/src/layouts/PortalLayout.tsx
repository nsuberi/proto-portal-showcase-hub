import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/challenges", label: "Challenges" },
  { path: "/showcase", label: "Showcase" },
  { path: "/community", label: "Community" },
];

export default function PortalLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-regolith">
      <nav className="sticky top-0 z-50 bg-deep-space border-b border-orbital-blue">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-semibold text-sm text-shelter-white tracking-wide">
              AI Builders
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-orbital-blue text-shelter-white"
                      : "text-dust hover:text-shelter-white hover:bg-orbital-blue/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="hidden sm:block text-xs font-medium text-dust hover:text-shelter-white transition-colors"
              >
                Profile
              </Link>
              <button
                type="button"
                className="sm:hidden p-1.5 rounded-md text-dust hover:text-shelter-white transition-colors"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden bg-deep-space border-t border-orbital-blue">
            <div className="px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-orbital-blue text-shelter-white"
                      : "text-dust hover:text-shelter-white hover:bg-orbital-blue/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/profile"
                    ? "bg-orbital-blue text-shelter-white"
                    : "text-dust hover:text-shelter-white hover:bg-orbital-blue/50"
                }`}
              >
                Profile
              </Link>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
