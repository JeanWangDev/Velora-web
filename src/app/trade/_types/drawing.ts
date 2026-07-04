/**
 * 画线工具类型（水平线、趋势线、矩形、文本等），与 `use-drawing-store`、kline 画布联动。
 */

export type DrawingTool =
  | "cursor"
  | "hline"
  | "trendline"
  | "rectangle"
  | "text";

export const DRAWING_COLORS: string[] = [
  "#22d3ee",
  "#facc15",
  "#22c55e",
  "#f43f5e",
  "#a855f7",
  "#f8fafc",
];

export interface DrawingBase {
  id: string;
  color: string;
}

/** Horizontal price level line — spans the full chart width */
export interface HorizontalLineDrawing extends DrawingBase {
  type: "hline";
  price: number;
}

/** Two-point diagonal trend line */
export interface TrendLineDrawing extends DrawingBase {
  type: "trendline";
  /** UTCTimestamp (seconds) snapped to the nearest bar on placement */
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
}

/** Rectangular price zone */
export interface RectangleDrawing extends DrawingBase {
  type: "rectangle";
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
}

/** Free-text annotation */
export interface TextLabelDrawing extends DrawingBase {
  type: "text";
  time: number;
  price: number;
  text: string;
}

export type Drawing =
  | HorizontalLineDrawing
  | TrendLineDrawing
  | RectangleDrawing
  | TextLabelDrawing;
