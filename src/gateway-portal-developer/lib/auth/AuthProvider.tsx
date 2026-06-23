"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

import { AuthSession, AuthUser } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  oauthSignIn: (provider: "google" | "github" | "azure-ad" | "apple") => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "gateway-portal-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      const sessionUser = session.user as AuthUser & {
        id?: string;
        role?: AuthUser["role"];
        lastLoginAt?: string;
      };
      setUser({
        id: sessionUser.id ?? sessionUser.email ?? "oauth-user",
        name: sessionUser.name ?? "Developer",
        email: sessionUser.email ?? "unknown@domain.com",
        role: sessionUser.role ?? "developer",
        lastLoginAt: sessionUser.lastLoginAt ?? new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const storedSession = JSON.parse(raw) as AuthSession;
      setUser(storedSession.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [session, status]);

  const signIn = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error("Invalid credentials");
    }
    const session = (await response.json()) as AuthSession;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session.user);
  };

  const oauthSignIn = async (provider: "google" | "github" | "azure-ad" | "apple") => {
    await nextAuthSignIn(provider, { callbackUrl: "/dashboard" });
  };

  const signOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    nextAuthSignOut({ callbackUrl: "/login" });
  };

  const value = useMemo(() => ({ user, loading, signIn, oauthSignIn, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
