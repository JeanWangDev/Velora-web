/**
 * Mirror of the unified market types served by trading-api.
 * Kept in sync with `trading-api/src/types/market.ts`.
 *
 * Don't import from the backend package directly — keep this declaration
 * standalone so the client stays decoupled.
 */

export const CANONICAL_INTERVALS = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

export type CanonicalInterval = (typeof CANONICAL_INTERVALS)[number];

export interface IKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IKlineTick extends IKline {
  isFinal: boolean;
}

export interface ITradeTick {
  time: number;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
}

export interface IExchangeMeta {
  id: string;
  name: string;
  description: string;
}

export interface ISymbolSummary {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  description: string;
}

export interface ISymbolInfo extends ISymbolSummary {
  pricePrecision: number;
  quantityPrecision: number;
  supportedIntervals: CanonicalInterval[];
}

/** Rolling 24h ticker stats (exchange-native window, not calendar day). */
export interface ITicker24h {
  symbol: string;
  lastPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
}
