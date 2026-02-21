import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wine } from "lucide-react";
import { Button } from "@/components/landing/button";
import { useAuth } from "@/contexts/AuthContext";

const appNavLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/learn", label: "Learn" }, // also active for /maps, /drills
  { to: "/tasting", label: "Taste" },
  { to: "/progress", label: "Progress" },
];

function isLearnActive(pathname: string) {
  return pathname === "/learn" || pathname.startsWith("/maps") || pathname.startsWith("/drills");
}

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { state, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary no-underline">
          <Wine className="w-6 h-6" />
          <span className="font-serif text-xl font-semibold tracking-wide">Wine App</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {appNavLinks.map(({ to, label }) => {
            const active =
              to === "/learn"
                ? isLearnActive(location.pathname)
                : location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors no-underline ${
                  active ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
          {state.user ? (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-32">
                {state.user.email}
              </span>
              <Button variant="hero" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="hero" size="sm">
                Log in
              </Button>
            </Link>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {appNavLinks.map(({ to, label }) => {
                const active =
                  to === "/learn"
                    ? isLearnActive(location.pathname)
                    : location.pathname === to || location.pathname.startsWith(to + "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`text-sm font-medium transition-colors no-underline ${
                      active ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
              {state.user ? (
                <>
                  <span className="text-sm text-muted-foreground">{state.user.email}</span>
                  <Button variant="hero" size="sm" onClick={() => { logout(); setIsOpen(false); }}>
                    Log out
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="hero" size="sm">
                    Log in
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default LandingNavbar;
