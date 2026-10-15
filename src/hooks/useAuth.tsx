import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { api, setUnauthorizedHandler } from "../api/client";
import type { LoginRequest, RegisterRequest, User } from "../types";
import { ApiError } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setSessionNotice("Your session expired. Please sign in again.");
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(() => undefined);
  }, [handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const me = await api.login(body);
    setUser(me);
    setSessionNotice(null);
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    const me = await api.register(body);
    setUser(me);
    setSessionNotice(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        // still clear local state
      }
    }
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionNotice,
      clearSessionNotice,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      loading,
      sessionNotice,
      clearSessionNotice,
      login,
      register,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
