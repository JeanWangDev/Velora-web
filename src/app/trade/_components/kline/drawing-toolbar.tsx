"use client";

import {
  Minus,
  MousePointer2,
  RectangleHorizontal,
  TrendingUp,
  Trash2,
  Type,
} from "lucide-react";
import {
  DRAWING_COLORS,
  type DrawingTool,
} from "@/app/trade/_types/drawing";
import { useDrawingStore } from "@/app/trade/_stores/use-drawing-store";

const TOOLS: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
  {
    id: "cursor",
    icon: <MousePointer2 className="h-3.5 w-3.5" />,
    label: "选择 / 拖动",
  },
  {
    id: "hline",
    icon: <Minus className="h-3.5 w-3.5" />,
    label: "水平线",
  },
  {
    id: "trendline",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    label: "趋势线（点两点）",
  },
  {
    id: "rectangle",
    icon: <RectangleHorizontal className="h-3.5 w-3.5" />,
    label: "矩形区域（点两点）",
  },
  {
    id: "text",
    icon: <Type className="h-3.5 w-3.5" />,
    label: "文字标注",
  },
];

export function DrawingToolbar() {
  const { activeTool, activeColor, setActiveTool, setActiveColor, clearAll } =
    useDrawingStore();

  return (
    <div className="flex items-center gap-1 border-b border-white/5 bg-slate-950/40 px-3 py-1.5">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => setActiveTool(tool.id)}
            className={`flex h-7 w-7 items-center justify-center rounded transition ${
              activeTool === tool.id
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-1.5 h-4 w-px bg-white/10" />

      {/* Color swatches */}
      <div className="flex items-center gap-1">
        {DRAWING_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => setActiveColor(color)}
            className={`h-3.5 w-3.5 rounded-full transition ${
              activeColor === color
                ? "ring-2 ring-white/60 ring-offset-1 ring-offset-slate-900"
                : "opacity-70 hover:opacity-100"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-1.5 h-4 w-px bg-white/10" />

      {/* Clear all */}
      <button
        type="button"
        title="清除所有标注"
        onClick={clearAll}
        className="flex h-7 items-center gap-1 rounded px-2 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
      >
        <Trash2 className="h-3 w-3" />
        清除
      </button>
    </div>
  );
}
