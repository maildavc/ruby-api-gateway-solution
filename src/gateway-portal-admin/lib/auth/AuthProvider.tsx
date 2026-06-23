"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw) as AuthSession;
        setUser({ ...session.user, permissions: session.user.permissions ?? [] });
      } catch (error) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

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
    setUser({ ...session.user, permissions: session.user.permissions ?? [] });
  };

  const oauthSignIn = async (provider: "google" | "github" | "azure-ad" | "apple") => {
    const response = await fetch(`/api/auth/oauth/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Unable to authenticate");
    }
    const session = (await response.json()) as AuthSession;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser({ ...session.user, permissions: session.user.permissions ?? [] });
  };

  const signOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
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
