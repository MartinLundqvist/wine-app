import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "../api/client";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string, user: AuthUser) => void;
  refreshToken: () => Promise<boolean>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
    isLoading: true,
  });

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const data = await authApi.refresh();
      setState((s) => ({
        ...s,
        accessToken: data.accessToken,
        user: data.user ?? s.user,
        isLoading: false,
      }));
      return true;
    } catch {
      setState({ accessToken: null, user: null, isLoading: false });
      return false;
    }
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  const setToken = useCallback((token: string, user: AuthUser) => {
    setState({ accessToken: token, user, isLoading: false });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken, user } = await authApi.login(email, password);
      setState({ accessToken, user, isLoading: false });
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { accessToken, user } = await authApi.register(email, password, displayName);
      setState({ accessToken, user, isLoading: false });
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ accessToken: null, user: null, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({
      state,
      login,
      register,
      logout,
      setToken,
      refreshToken,
    }),
    [state, login, register, logout, setToken, refreshToken]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
