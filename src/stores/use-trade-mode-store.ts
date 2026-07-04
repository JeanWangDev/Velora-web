"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TradeMode = "spot" | "futures";

interface TradeModeState {
  mode: TradeMode;
  setMode: (mode: TradeMode) => void;
}

export const useTradeModeStore = create<TradeModeState>()(
  persist(
    (set) => ({
      mode: "spot",
      setMode: (mode) => set({ mode }),
    }),
    { name: "velora-trade-mode" },
  ),
);
