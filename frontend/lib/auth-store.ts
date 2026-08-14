"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userId: number | null;
  businessName: string | null;
  email: string | null;
  setSession: (session: { token: string; userId: number; businessName: string; email: string }) => void;
  clearSession: () => void;
}

// Mirrors auth state into a plain (non-httpOnly) cookie purely so the edge
// middleware can make instant routing decisions without shipping JS first.
// This is NOT the authorization mechanism for API calls — that remains the
// Authorization header built from the Zustand-held token (see api-client.ts).
function syncAuthCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `stockwise_token=${token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
  } else {
    document.cookie = "stockwise_token=; path=/; max-age=0";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      businessName: null,
      email: null,
      setSession: ({ token, userId, businessName, email }) => {
        set({ token, userId, businessName, email });
        syncAuthCookie(token);
      },
      clearSession: () => {
        set({ token: null, userId: null, businessName: null, email: null });
        syncAuthCookie(null);
      },
    }),
    { name: "stockwise-auth" }
  )
);
