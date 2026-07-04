"use client";

import { create } from "zustand";
import { AuthService } from "@/services/auth-service";
import {
  clearAccessTokenCookie,
  clearAccessTokenExpiresAtCookie,
  getAccessTokenCookie,
  setAccessTokenCookie,
  setAccessTokenExpiresAtCookie,
} from "@/utils/auth-cookie";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setSession: (accessToken: string, user: AuthUser, expiresAt?: number) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  hydrated: false,

  setUser: (user) => set({ user }),

  setSession: (accessToken, user, expiresAt) => {
    setAccessTokenCookie(accessToken, expiresAt);
    if (expiresAt) {
      setAccessTokenExpiresAtCookie(expiresAt);
    }
    set({ user });
  },

  logout: () => {
    clearAccessTokenCookie();
    clearAccessTokenExpiresAtCookie();
    set({ user: null });
  },

  hydrate: async () => {
    const token = getAccessTokenCookie();
    if (!token) {
      set({ hydrated: true, user: null });
      return;
    }

    set({ loading: true });
    try {
      const result = await AuthService.me();
      set({ user: result.user, hydrated: true });
    } catch {
      clearAccessTokenCookie();
      clearAccessTokenExpiresAtCookie();
      set({ user: null, hydrated: true });
    } finally {
      set({ loading: false });
    }
  },
}));
