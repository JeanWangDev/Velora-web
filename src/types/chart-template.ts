export type TemplateVisibility = "private" | "public";

export type ChartTemplate = {
  id: string;
  name: string;
  symbolId: number | null;
  symbol: string;
  indicatorIds: string[];
  visibility: TemplateVisibility;
  isDefault: boolean;
  isOfficial: boolean;
  createdAt: number;
  updatedAt: number;
};
