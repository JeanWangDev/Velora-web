"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiseFallMode = "intl" | "cn";
export type TimezonePref = "local" | "utc" | "utc8";
export type FiatCurrency =
  | "CNY"
  | "USD"
  | "RUB"
  | "JPY"
  | "EUR"
  | "VND"
  | "IDR"
  | "PHP"
  | "INR";

interface PreferencesState {
  riseFall: RiseFallMode;
  timezone: TimezonePref;
  fiatCurrency: FiatCurrency;
  setRiseFall: (mode: RiseFallMode) => void;
  setTimezone: (tz: TimezonePref) => void;
  setFiatCurrency: (c: FiatCurrency) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      riseFall: "intl",
      timezone: "local",
      fiatCurrency: "CNY",
      setRiseFall: (riseFall) => set({ riseFall }),
      setTimezone: (timezone) => set({ timezone }),
      setFiatCurrency: (fiatCurrency) => set({ fiatCurrency }),
    }),
    { name: "velora-preferences" },
  ),
);
