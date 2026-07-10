/**
 * TradingView SeriesStyle 与 OKX 图表类型菜单对齐。
 * 数值来自 Charting Library v1.15 `SeriesStyle` 枚举。
 *
 * Renko/Kagi/PnF/LineBreak（4–7）需 `japanese_chart_styles` 特性，
 * 当前嵌入配置下 setChartType 会抛错，故仅暴露基础类型。
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
    | "trade.chartTypes.area";
};

/** TV v1.15 当前配置下可直接 setChartType 的类型 */
export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  { value: 1, labelKey: "trade.chartTypes.candles" },
  { value: 0, labelKey: "trade.chartTypes.bars" },
  { value: 2, labelKey: "trade.chartTypes.line" },
  { value: 3, labelKey: "trade.chartTypes.area" },
  { value: 8, labelKey: "trade.chartTypes.heikinAshi" },
  { value: 9, labelKey: "trade.chartTypes.hollowCandles" },
];

export const DEFAULT_CHART_TYPE: TVSeriesStyle = 1;

export const CHART_TYPE_STORAGE_KEY = "polaris.chartType";

const VALID = new Set<number>(CHART_TYPE_OPTIONS.map((item) => item.value));

/** 旧版 localStorage 可能存有日式图表类型，统一回退为 K 线 */
const LEGACY_UNSUPPORTED = new Set([4, 5, 6, 7]);

export function isValidChartType(value: unknown): value is TVSeriesStyle {
  return typeof value === "number" && VALID.has(value);
}

export function normalizeChartType(value: unknown): TVSeriesStyle {
  if (typeof value === "number" && LEGACY_UNSUPPORTED.has(value)) {
    return DEFAULT_CHART_TYPE;
  }
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
