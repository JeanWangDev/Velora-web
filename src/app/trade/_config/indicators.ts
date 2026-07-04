/**
 * 交易页指标目录（由 data.ts 源表 + tv-study 映射生成）。
 */
export type {
  IndicatorCategoryId,
  TradeIndicatorDefinition,
} from "@/app/trade/_types/indicators";

export { INDICATOR_CATEGORIES } from "@/app/trade/_config/build-indicators";

import { buildTradeIndicators } from "@/app/trade/_config/build-indicators";
import type {
  IndicatorCategoryId,
  TradeIndicatorDefinition,
} from "@/app/trade/_types/indicators";

/** 指标面板使用的完整列表（tech 去重后约 98 条 + 业务指标 Phase 2） */
export const TRADE_INDICATORS: TradeIndicatorDefinition[] =
  buildTradeIndicators();

export function getIndicatorsByCategory(category: IndicatorCategoryId) {
  return TRADE_INDICATORS.filter((item) => item.category === category);
}

export function getIndicatorById(id: string) {
  return TRADE_INDICATORS.find((item) => item.id === id);
}

/** 本地搜索：匹配英文名、中文名、展示标签、TV study 名 */
export function searchIndicators(
  query: string,
  options?: { category?: IndicatorCategoryId; allCategories?: boolean },
) {
  const q = query.trim().toLowerCase();
  const pool =
    options?.allCategories || q.length > 0
      ? TRADE_INDICATORS
      : options?.category
        ? getIndicatorsByCategory(options.category)
        : TRADE_INDICATORS;

  if (!q) {
    return options?.category && !options?.allCategories
      ? getIndicatorsByCategory(options.category)
      : pool;
  }

  return pool.filter((item) => {
    const haystacks = [
      item.id,
      item.labelEn,
      item.labelZh,
      item.tvStudyName ?? "",
      item.dataCode ?? "",
    ];
    return haystacks.some((text) => text.toLowerCase().includes(q));
  });
}
