"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DockTab = "order" | "book";

interface TradeDockState {
  tab: DockTab;
  x: number;
  y: number;
  collapsed: boolean;
  setTab: (tab: DockTab) => void;
  setPosition: (x: number, y: number) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useTradeDockStore = create<TradeDockState>()(
  persist(
    (set) => ({
      tab: "order",
      x: 24,
      y: 24,
      collapsed: false,
      setTab: (tab) => set({ tab }),
      setPosition: (x, y) => set({ x, y }),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "velora-trade-dock" },
  ),
);
