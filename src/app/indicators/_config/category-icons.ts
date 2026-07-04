/** /indicators 指标目录页的六大分类图标（与 i18n categories key 对应） */
import {
  Activity,
  BarChart3,
  Brain,
  Droplets,
  LineChart,
  Link2,
} from "lucide-react";
import type { ComponentType } from "react";

export const INDICATOR_CATEGORY_ICONS = {
  liquidity: Droplets,
  sentiment: Brain,
  options: Activity,
  microstructure: BarChart3,
  onchain: Link2,
  technical: LineChart,
} as const satisfies Record<
  string,
  ComponentType<{ className?: string }>
>;
