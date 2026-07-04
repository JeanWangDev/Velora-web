/**
 * 交易页右侧竖条 Tab（图标 + i18n key + hover 说明）
 */
import type { ComponentType } from "react";
import { ClipboardList, FileText, Layers, Newspaper, Sparkles, Target, Wallet } from "lucide-react";
import type { PanelTab } from "@/app/trade/_types/chart";

type PanelLabelKey =
  | "trade.panels.events"
  | "trade.panels.templates"
  | "trade.panels.bscTrade"
  | "trade.panels.indicators"
  | "trade.panels.levels"
  | "trade.panels.brief"
  | "trade.panels.research";

type PanelHintKey =
  | "trade.panels.hints.events"
  | "trade.panels.hints.templates"
  | "trade.panels.hints.bscTrade"
  | "trade.panels.hints.indicators"
  | "trade.panels.hints.levels"
  | "trade.panels.hints.brief"
  | "trade.panels.hints.research";

export const PANEL_TABS: Array<{
  id: PanelTab;
  icon: ComponentType<{ className?: string }>;
  labelKey: PanelLabelKey;
  hintKey: PanelHintKey;
}> = [
  {
    id: "events",
    icon: Newspaper,
    labelKey: "trade.panels.events",
    hintKey: "trade.panels.hints.events",
  },
  {
    id: "templates",
    icon: Layers,
    labelKey: "trade.panels.templates",
    hintKey: "trade.panels.hints.templates",
  },
  {
    id: "bscTrade",
    icon: Wallet,
    labelKey: "trade.panels.bscTrade",
    hintKey: "trade.panels.hints.bscTrade",
  },
  {
    id: "indicators",
    icon: Sparkles,
    labelKey: "trade.panels.indicators",
    hintKey: "trade.panels.hints.indicators",
  },
  {
    id: "levels",
    icon: Target,
    labelKey: "trade.panels.levels",
    hintKey: "trade.panels.hints.levels",
  },
  {
    id: "brief",
    icon: ClipboardList,
    labelKey: "trade.panels.brief",
    hintKey: "trade.panels.hints.brief",
  },
  {
    id: "research",
    icon: FileText,
    labelKey: "trade.panels.research",
    hintKey: "trade.panels.hints.research",
  },
];
