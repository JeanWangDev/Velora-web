export type TradingPair = {
  id: number;
  baseAsset: string;
  symbol: string;
  exchange: string;
  displayName: string;
  sortOrder: number;
  isDefault: boolean;
  accessTier: 0 | 1;
  status: number;
  locked?: boolean;
};
