/**
 * 暴露给交易页工具栏的图表控制能力（截图、指标增删）。
 * 由 `tv-chart.tsx` 在 widget ready 后构造并回调给 page。
 */

/** 交易页与 TV widget 的桥接 API，在 widget.onChartReady 后构造 */
export interface TVChartControls {
  setChartType: (type: number) => void;
  getChartType: () => number;
  takeScreenshot: () => void;
  /** 按指标 id 增删 study；id → entityId 映射在 tv-chart 内维护 */
  applyIndicators: (toAddIds: string[], toRemoveIds: string[]) => Promise<void>;
  getAppliedIndicatorIds: () => string[];
  /** 图表侧 study 变化时通知 IndicatorPanel 同步勾选态 */
  subscribeAppliedIndicators: (
    listener: (ids: string[]) => void,
  ) => () => void;
  /** 在 K 线上绘制支撑/压力水平线（蓝/红） */
  setPriceLevels: (levels: {
    supports: number[];
    resistances: number[];
  }) => void;
  clearPriceLevels: () => void;
}
