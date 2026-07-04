/**
 * /trade 页面级类型（仅交易路由使用）。
 * TV resolution 与后端 canonical interval 的映射在 `_components/tv-chart/datafeed.ts`。
 */

/** TradingView Charting Library resolution 字符串，如 "15" = 15m、"1D" = 日 K */
export type TVResolution =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "360"
  | "480"
  | "720"
  | "1D"
  | "3D"
  | "1W"
  | "1M";

/** 右侧竖条可展开的抽屉 Tab */
export type PanelTab =
  | "events"
  | "indicators"
  | "templates"
  | "bscTrade"
  | "research"
  | "levels"
  | "brief";

/**
 * TradingView Charting Library v1.15 `SeriesStyle` 数值。
 * @see public/charting_library/charting_library/charting_library.min.d.ts
 */
export type TVSeriesStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
