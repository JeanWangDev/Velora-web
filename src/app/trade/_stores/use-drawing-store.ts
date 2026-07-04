/** 交易页画线工具状态（kline 画布用），仅 /trade 路由使用 */
"use client";

import { create } from "zustand";
import type { Drawing, DrawingTool } from "@/app/trade/_types/drawing";

interface DrawingState {
  activeTool: DrawingTool; // 当前工具：光标 / 水平线 / 趋势线等
  activeColor: string;
  drawings: Drawing[]; // 已画在图表上的实体
  setActiveTool: (tool: DrawingTool) => void;
  setActiveColor: (color: string) => void;
  addDrawing: (drawing: Drawing) => void;
  removeDrawing: (id: string) => void;
  clearAll: () => void;
}

// 当前选中的画线工具、颜色与已放置图形列表（kline 画布读写）
export const useDrawingStore = create<DrawingState>((set) => ({
  activeTool: "cursor",
  activeColor: "#22d3ee",
  drawings: [],
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  addDrawing: (drawing) =>
    set((state) => ({ drawings: [...state.drawings, drawing] })),
  removeDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
    })),
  clearAll: () => set({ drawings: [] }),
}));
