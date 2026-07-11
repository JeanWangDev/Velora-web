"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "./types";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * Persists current locale to localStorage under key "app-locale".
 * The default `zh` keeps existing behavior; the persisted value (if any)
 * is loaded on app start.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "zh-CN" as Locale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "velora-locale",
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const state = persisted as LocaleState | undefined;
        if (!state) return { locale: "zh-CN" as Locale, setLocale: () => {} };
        if ((state.locale as string) === "zh") {
          return { ...state, locale: "zh-CN" };
        }
        return state;
      },
      version: 1,
    },
  ),
);
