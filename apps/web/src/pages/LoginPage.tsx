import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/learn";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen dark bg-background text-foreground font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-md">
      <h1 className="font-serif text-3xl text-foreground mb-6">{tab === "login" ? "Log in" : "Register"}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm text-muted-foreground mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        {tab === "register" && (
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm text-muted-foreground mb-1">Display name (optional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm text-muted-foreground mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
          />
        </div>
        {error && <p className="text-destructive mb-4">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-wine-light focus:ring-2 focus:ring-accent transition-colors"
          >
            {tab === "login" ? "Log in" : "Register"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab(tab === "login" ? "register" : "login");
              setError("");
            }}
            className="px-4 py-2 rounded-md border border-oak text-foreground hover:bg-oak transition-colors"
          >
            {tab === "login" ? "Register instead" : "Log in instead"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
