"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BottomDeskTab = "open" | "history" | "trades" | "assets";
export type ExecutionTab = "depth" | "trades";

interface TerminalState {
  marketRailOpen: boolean;
  bottomDeskHeight: number;
  bottomTab: BottomDeskTab;
  executionTab: ExecutionTab;
  toggleMarketRail: () => void;
  setBottomDeskHeight: (h: number) => void;
  setBottomTab: (tab: BottomDeskTab) => void;
  setExecutionTab: (tab: ExecutionTab) => void;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      marketRailOpen: false,
      bottomDeskHeight: 168,
      bottomTab: "open",
      executionTab: "depth",
      toggleMarketRail: () =>
        set({ marketRailOpen: !get().marketRailOpen }),
      setBottomDeskHeight: (h) =>
        set({ bottomDeskHeight: Math.min(420, Math.max(140, h)) }),
      setBottomTab: (bottomTab) => set({ bottomTab }),
      setExecutionTab: (executionTab) => set({ executionTab }),
    }),
    {
      name: "velora-terminal",
      partialize: (s) => ({
        marketRailOpen: s.marketRailOpen,
        bottomDeskHeight: s.bottomDeskHeight,
        bottomTab: s.bottomTab,
      }),
    },
  ),
);
