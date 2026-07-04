import type { MarketBrief } from "@/app/trade/_types/market-brief";

export type StrategyVisibility = "draft" | "public";

export interface StrategyStats {
  totalReturnPct: string;
  maxDrawdownPct: string;
  sharpeRatio: string;
  winRate: string;
  tradeCount: number;
  equityUsdt: string;
}

export interface StrategyProduct {
  strategyKey: string;
  planKey: string;
  name: string;
  summary: string;
  description: string;
  symbol: string;
  interval: string;
  templateId: string | null;
  tags: string[];
  priceUsdt: string | null;
  durationDays: number | null;
  asset: string;
  chain: string;
  subscribed: boolean;
  subscriptionEndsAt: number | null;
  creatorUserId: number | null;
  creatorNickname: string | null;
  followerCount: number;
  followFeeUsdt: string;
  platformFeeRate: string;
  visibility: StrategyVisibility;
  isOfficial: boolean;
  isOwner: boolean;
  stats: StrategyStats | null;
}

export interface StrategySignalPayload {
  strategyKey: string;
  symbol: string;
  interval: string;
  brief: MarketBrief;
  subscriptionEndsAt: number | null;
}

export interface CreateStrategyInput {
  strategyKey: string;
  name: string;
  summary?: string;
  description: string;
  symbol: string;
  interval: string;
  templateId?: string | null;
  tags?: string[];
  followFeeUsdt?: number;
  durationDays?: number;
  visibility?: StrategyVisibility;
}
