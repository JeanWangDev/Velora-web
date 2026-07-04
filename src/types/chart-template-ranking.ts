import type { ChartTemplate } from "@/types/chart-template";

export type TemplateRankingPeriod = "week" | "month";

export type ChartTemplateRankingItem = {
  rank: number;
  applyCount: number;
  copyCount: number;
  score: number;
  template: ChartTemplate;
};

export type ChartTemplateRankingsResponse = {
  period: TemplateRankingPeriod;
  items: ChartTemplateRankingItem[];
};
