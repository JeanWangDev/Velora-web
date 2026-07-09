"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiseFallMode = "intl" | "cn"; // intl=绿涨红跌  cn=红涨绿跌
export type TimezonePref = "local" | "utc" | "utc8";
export type FiatCurrency =
  | "CNY" | "USD" | "RUB" | "JPY" | "EUR"
  | "VND" | "IDR" | "PHP" | "INR";
export type ThemeMode = "dark" | "light";
export type CandleOpen = "prev-close" | "first-trade"; // K线开盘价
export type VolatilityBase = "24h" | "utc"; // 涨跌幅起始时间

interface PreferencesState {
  // 外观
  theme: ThemeMode;
  riseFall: RiseFallMode;

  // 交易确认弹窗
  confirmLimit: boolean;
  confirmMarket: boolean;
  confirmStopLoss: boolean;
  confirmChase: boolean;

  // 订单通知
  notifyFill: boolean;
  notifyCancel: boolean;
  notifySound: boolean;

  // 市价提示
  marketIncompleteHint: boolean;

  // K 线
  candleOpen: CandleOpen;
  volatilityBase: VolatilityBase;

  // 传统
  timezone: TimezonePref;
  fiatCurrency: FiatCurrency;

  // setters
  setTheme: (t: ThemeMode) => void;
  setRiseFall: (m: RiseFallMode) => void;
  setConfirmLimit: (v: boolean) => void;
  setConfirmMarket: (v: boolean) => void;
  setConfirmStopLoss: (v: boolean) => void;
  setConfirmChase: (v: boolean) => void;
  setNotifyFill: (v: boolean) => void;
  setNotifyCancel: (v: boolean) => void;
  setNotifySound: (v: boolean) => void;
  setMarketIncompleteHint: (v: boolean) => void;
  setCandleOpen: (v: CandleOpen) => void;
  setVolatilityBase: (v: VolatilityBase) => void;
  setTimezone: (tz: TimezonePref) => void;
  setFiatCurrency: (c: FiatCurrency) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "dark",
      riseFall: "intl",
      confirmLimit: true,
      confirmMarket: false,
      confirmStopLoss: true,
      confirmChase: true,
      notifyFill: true,
      notifyCancel: true,
      notifySound: true,
      marketIncompleteHint: true,
      candleOpen: "prev-close",
      volatilityBase: "24h",
      timezone: "local",
      fiatCurrency: "CNY",
      setTheme: (theme) => set({ theme }),
      setRiseFall: (riseFall) => set({ riseFall }),
      setConfirmLimit: (confirmLimit) => set({ confirmLimit }),
      setConfirmMarket: (confirmMarket) => set({ confirmMarket }),
      setConfirmStopLoss: (confirmStopLoss) => set({ confirmStopLoss }),
      setConfirmChase: (confirmChase) => set({ confirmChase }),
      setNotifyFill: (notifyFill) => set({ notifyFill }),
      setNotifyCancel: (notifyCancel) => set({ notifyCancel }),
      setNotifySound: (notifySound) => set({ notifySound }),
      setMarketIncompleteHint: (marketIncompleteHint) => set({ marketIncompleteHint }),
      setCandleOpen: (candleOpen) => set({ candleOpen }),
      setVolatilityBase: (volatilityBase) => set({ volatilityBase }),
      setTimezone: (timezone) => set({ timezone }),
      setFiatCurrency: (fiatCurrency) => set({ fiatCurrency }),
    }),
    { name: "velora-preferences" },
  ),
);
