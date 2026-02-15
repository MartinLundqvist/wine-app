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
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

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
    <div className="min-h-screen bg-cellar-950 text-linen-100 font-ui flex items-center justify-center p-6">
      <div className="w-full max-w-md">
      <h1 className="font-display text-h1 text-linen-100 mb-6">{tab === "login" ? "Log in" : "Register"}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-small text-cork-400 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-control bg-cellar-800 border border-cork-500 text-linen-100 focus:ring-2 focus:ring-brass-500 focus:border-transparent"
          />
        </div>
        {tab === "register" && (
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-small text-cork-400 mb-1">Display name (optional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-control bg-cellar-800 border border-cork-500 text-linen-100 focus:ring-2 focus:ring-brass-500"
            />
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="password" className="block text-small text-cork-400 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-control bg-cellar-800 border border-cork-500 text-linen-100 focus:ring-2 focus:ring-brass-500"
          />
        </div>
        {error && <p className="text-oxblood-700 mb-4">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-control bg-burgundy-700 text-linen-100 hover:bg-burgundy-600 focus:ring-2 focus:ring-brass-500 transition-colors"
          >
            {tab === "login" ? "Log in" : "Register"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab(tab === "login" ? "register" : "login");
              setError("");
            }}
            className="px-4 py-2 rounded-control border border-oak-600 text-linen-100 hover:bg-oak-700 transition-colors"
          >
            {tab === "login" ? "Register instead" : "Log in instead"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
