export type TradingPair = {
  id: number;
  baseAsset: string;
  symbol: string;
  exchange: string;
  displayName: string;
  sortOrder: number;
  isDefault: boolean;
  status: number;
};
