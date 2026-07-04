"use client";

import { create } from "zustand";

export type SideRailPanel =
  | "orderbook"
  | "order"
  | "openOrders"
  | "trades"
  | "settings"
  | null;

interface SideRailState {
  active: SideRailPanel;
  setActive: (panel: SideRailPanel) => void;
  toggle: (panel: Exclude<SideRailPanel, null>) => void;
}

export const useSideRailStore = create<SideRailState>((set, get) => ({
  active: null,
  setActive: (panel) => set({ active: panel }),
  toggle: (panel) => {
    const { active } = get();
    set({ active: active === panel ? null : panel });
  },
}));
