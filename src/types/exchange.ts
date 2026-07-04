export type SymbolStatus = "trading" | "halt" | "pre_list";

export interface MarketSymbol {
  symbol: string;
  base: string;
  quote: string;
  displayName: string;
  pricePrecision: number;
  qtyPrecision: number;
  minQty: number;
  status: SymbolStatus;
}

export interface Ticker {
  symbol: string;
  last: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface MarketTrade {
  id: string;
  price: number;
  qty: number;
  side: "buy" | "sell";
  ts: number;
}

export interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderSide = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "open" | "partial" | "filled" | "cancelled";

export interface ExchangeOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number | null;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: number;
}

export interface UserTrade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  fee: number;
  feeCurrency: string;
  role: "maker" | "taker";
  ts: number;
}

export interface Balance {
  currency: string;
  available: number;
  frozen: number;
}

export type LedgerType =
  | "trade"
  | "fee"
  | "freeze"
  | "unfreeze"
  | "credit"
  | "deposit"
  | "withdraw";

export interface LedgerEntry {
  id: string;
  currency: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  refId: string;
  ts: number;
}

export interface Announcement {
  id: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  contentZh: string;
  contentEn: string;
  category: "maintenance" | "listing" | "risk";
  publishedAt: number;
}
