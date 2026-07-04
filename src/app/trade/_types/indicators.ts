/**
 * 交易页「指标」抽屉：分类与单条指标的类型定义。
 * 数据表在 `_config/indicators.ts`；TV 叠加用 `tvStudyName` + `createStudy`。
 */

/** 与 i18n `indicators.categories.*` 及指标目录分类一致 */
export type IndicatorCategoryId =
  | "liquidity"
  | "sentiment"
  | "options"
  | "microstructure"
  | "onchain"
  | "technical";

export interface TradeIndicatorDefinition {
  /** 业务唯一 id，与 tv-chart studyEntityMap 的 key 一致 */
  id: string;
  category: IndicatorCategoryId;
  labelZh: string;
  labelEn: string;
  /** TV 内置 study 英文名，如 "Moving Average"；无则不可上图 */
  tvStudyName?: string;
  /** true = 叠在主图；false = 独立窗格（如 RSI、MACD） */
  forceOverlay?: boolean;
  /** true = 仅目录展示，数据指标待 Phase 2 接入 */
  phase2?: boolean;
  /** 源表 data.ts 的 code，对接 trading-api 时用 */
  dataCode?: string;
}

export interface TradeIndicatorApplyItem {
  id: string;
  tvStudyName: string;
  forceOverlay: boolean;
}
