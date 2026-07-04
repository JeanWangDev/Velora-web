import {
  CategoryEnum,
  indicatorList,
  type SourceIndicatorItem,
} from "@/app/trade/_config/data";
import {
  isOverlayStudy,
  TV_STUDY_NAME_OVERRIDES,
  TV_UNAVAILABLE_STUDIES,
} from "@/app/trade/_config/tv-study";
import { TECHNICAL_LABEL_ZH } from "@/app/trade/_config/indicator-display";
import type {
  IndicatorCategoryId,
  TradeIndicatorDefinition,
} from "@/app/trade/_types/indicators";

export const INDICATOR_CATEGORIES: IndicatorCategoryId[] = [
  "technical",
  "liquidity",
  "sentiment",
  "options",
  "microstructure",
  "onchain",
];

const SOURCE_TO_PANEL_CATEGORY: Record<CategoryEnum, IndicatorCategoryId> = {
  [CategoryEnum.tech]: "technical",
  [CategoryEnum.chain]: "onchain",
  [CategoryEnum.market]: "microstructure",
  [CategoryEnum.liquidity]: "liquidity",
  [CategoryEnum.sentiment]: "sentiment",
  [CategoryEnum.options]: "options",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveTvStudyName(displayName: string): string {
  return TV_STUDY_NAME_OVERRIDES[displayName] ?? displayName;
}

/** 同一 tvStudy 多条配置时，优先保留「用户命名 / 需映射」那条 */
function pickPreferredTechEntry(
  entries: SourceIndicatorItem[],
): SourceIndicatorItem {
  const withOverride = entries.find((item) => TV_STUDY_NAME_OVERRIDES[item.id]);
  if (withOverride) return withOverride;

  const alias = entries.find((item) => item.id !== resolveTvStudyName(item.id));
  if (alias) return alias;

  return entries[0];
}

function buildTechnicalIndicators(): TradeIndicatorDefinition[] {
  const techItems = indicatorList.filter(
    (item) => item.category === CategoryEnum.tech,
  );

  const byTvStudy = new Map<string, SourceIndicatorItem[]>();

  for (const item of techItems) {
    if (TV_UNAVAILABLE_STUDIES.has(item.id)) continue;

    const tvStudyName = resolveTvStudyName(item.id);
    const group = byTvStudy.get(tvStudyName) ?? [];
    group.push(item);
    byTvStudy.set(tvStudyName, group);
  }

  const result: TradeIndicatorDefinition[] = [];

  for (const [, group] of byTvStudy) {
    const item = pickPreferredTechEntry(group);
    const tvStudyName = resolveTvStudyName(item.id);
    const category = SOURCE_TO_PANEL_CATEGORY[item.category];

    result.push({
      id: `${category}.${slugify(item.id)}`,
      category,
      labelEn: item.name,
      labelZh: TECHNICAL_LABEL_ZH[item.id] ?? (item.description || item.name),
      tvStudyName,
      forceOverlay: isOverlayStudy(tvStudyName),
    });
  }

  result.sort((a, b) => a.labelEn.localeCompare(b.labelEn, "en"));
  return result;
}

function buildDataIndicators(): TradeIndicatorDefinition[] {
  const dataItems = indicatorList.filter(
    (item) => item.category !== CategoryEnum.tech,
  );

  return dataItems.map((item) => {
    const category = SOURCE_TO_PANEL_CATEGORY[item.category];
    const key = item.code ?? item.id;

    return {
      id: `${category}.${slugify(key)}`,
      category,
      labelEn: item.name,
      labelZh: item.description || item.name,
      phase2: true,
      dataCode: item.code,
    };
  });
}

export function buildTradeIndicators(): TradeIndicatorDefinition[] {
  return [...buildDataIndicators(), ...buildTechnicalIndicators()];
}
