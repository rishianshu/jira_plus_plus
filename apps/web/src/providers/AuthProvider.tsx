import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useApolloClient } from "@apollo/client";
import { TOKEN_STORAGE_KEY } from "../lib/apollo-client";
import { onUnauthorized } from "../lib/auth-events";

const USER_STORAGE_KEY = "jira-plus-plus/user";

export type Role = "ADMIN" | "MANAGER" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const apolloClient = useApolloClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    await apolloClient.clearStore();
  }, [apolloClient]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void logout();
    });
    return unsubscribe;
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: (nextToken, nextUser) => {
        setUser(nextUser);
        setToken(nextToken);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      },
      logout,
    }),
    [logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
