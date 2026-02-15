import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, logout } = useAuth();

  const nav = [
    { to: "/", label: "Home" },
    { to: "/maps", label: "Maps" },
    { to: "/drills", label: "Drills" },
    { to: "/progress", label: "Progress" },
    { to: "/tasting", label: "Tasting" },
  ];

  return (
    <div className="min-h-screen bg-cellar-950 text-linen-100 font-ui flex flex-col">
      <header className="h-14 flex-shrink-0 bg-cellar-900 border-b border-cork-500/30 flex items-center justify-between px-6">
        <Link to="/" className="font-display text-h2 font-semibold text-linen-100 no-underline">
          Wine App
        </Link>
        <div className="flex items-center gap-4">
          {state.user ? (
            <>
              <span className="text-small text-cork-400">{state.user.email}</span>
              <Button variant="tertiary" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-52 flex-shrink-0 bg-cellar-900 border-r border-cork-500/30 py-4">
          <nav className="flex flex-col gap-0.5 px-3">
            {nav.map(({ to, label }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded-control text-body no-underline transition-colors duration-fast ${
                    active
                      ? "bg-burgundy-800/50 text-linen-100 border-l-2 border-brass-500 -ml-[2px] pl-[14px]"
                      : "text-cork-400 hover:text-linen-100 hover:bg-cellar-800"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
