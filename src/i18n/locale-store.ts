"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "./dictionaries";

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
      locale: "zh",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "velora-locale",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
