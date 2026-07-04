/**
 * TradingView SeriesStyle 与 Binance 图表类型菜单对齐。
 * 数值来自 Charting Library v1.15 `SeriesStyle` 枚举。
 */
import type { TVSeriesStyle } from "@/app/trade/_types/chart";

export type ChartTypeOption = {
  value: TVSeriesStyle;
  labelKey:
    | "trade.chartTypes.bars"
    | "trade.chartTypes.candles"
    | "trade.chartTypes.hollowCandles"
    | "trade.chartTypes.heikinAshi"
    | "trade.chartTypes.line"
    | "trade.chartTypes.area"
    | "trade.chartTypes.renko"
    | "trade.chartTypes.lineBreak"
    | "trade.chartTypes.kagi"
    | "trade.chartTypes.pointAndFigure";
};

/** 与 Binance 现货图表类型顺序基本一致（v1.15 无「基准线」） */
export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: 0, labelKey: "trade.chartTypes.bars" },
  { value: 1, labelKey: "trade.chartTypes.candles" },
  { value: 9, labelKey: "trade.chartTypes.hollowCandles" },
  { value: 8, labelKey: "trade.chartTypes.heikinAshi" },
  { value: 2, labelKey: "trade.chartTypes.line" },
  { value: 3, labelKey: "trade.chartTypes.area" },
  { value: 4, labelKey: "trade.chartTypes.renko" },
  { value: 7, labelKey: "trade.chartTypes.lineBreak" },
  { value: 5, labelKey: "trade.chartTypes.kagi" },
  { value: 6, labelKey: "trade.chartTypes.pointAndFigure" },
];

export const DEFAULT_CHART_TYPE: TVSeriesStyle = 1;

export const CHART_TYPE_STORAGE_KEY = "polaris.chartType";

const VALID = new Set<number>(CHART_TYPE_OPTIONS.map((item) => item.value));

export function isValidChartType(value: unknown): value is TVSeriesStyle {
  return typeof value === "number" && VALID.has(value);
}

export function normalizeChartType(value: unknown): TVSeriesStyle {
  return isValidChartType(value) ? value : DEFAULT_CHART_TYPE;
}

export function chartTypeLabelKey(
  value: TVSeriesStyle,
): ChartTypeOption["labelKey"] {
  return (
    CHART_TYPE_OPTIONS.find((item) => item.value === value)?.labelKey ??
    "trade.chartTypes.candles"
  );
}
