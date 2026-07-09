"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LayoutPreset =
  | "standard"  // 标准版：订单簿+成交(左) | K线+下单(中) | 币对选择(右)
  | "pro-right" // 专业模式：K线(左) | 订单簿(中) | 下单(右)
  | "pro-left"; // 宽平模式：市场列表 | K线+下单 | 订单簿 | 成交

export interface LayoutInfo {
  id: LayoutPreset;
  label: string;
  labelEn: string;
}

export const LAYOUTS: LayoutInfo[] = [
  { id: "standard",  label: "标准版",   labelEn: "Standard" },
  { id: "pro-right", label: "专业模式", labelEn: "Pro" },
  { id: "pro-left",  label: "宽平模式", labelEn: "Wide" },
];

interface LayoutState {
  layout: LayoutPreset;
  setLayout: (l: LayoutPreset) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layout: "standard",
      setLayout: (layout) => set({ layout }),
    }),
    { name: "velora-layout" },
  ),
);
