import type {
  Announcement,
  Balance,
  ExchangeOrder,
  KlineBar,
  LedgerEntry,
  MarketSymbol,
  MarketTrade,
  OrderBook,
  Ticker,
  UserTrade,
} from "@/types/exchange";

export const MOCK_SYMBOLS: MarketSymbol[] = [
  {
    symbol: "BTC-USDT",
    base: "BTC",
    quote: "USDT",
    displayName: "Bitcoin",
    pricePrecision: 2,
    qtyPrecision: 6,
    minQty: 0.0001,
    status: "trading",
  },
  {
    symbol: "ETH-USDT",
    base: "ETH",
    quote: "USDT",
    displayName: "Ethereum",
    pricePrecision: 2,
    qtyPrecision: 5,
    minQty: 0.001,
    status: "trading",
  },
  {
    symbol: "SOL-USDT",
    base: "SOL",
    quote: "USDT",
    displayName: "Solana",
    pricePrecision: 3,
    qtyPrecision: 3,
    minQty: 0.01,
    status: "trading",
  },
  {
    symbol: "BNB-USDT",
    base: "BNB",
    quote: "USDT",
    displayName: "BNB",
    pricePrecision: 2,
    qtyPrecision: 4,
    minQty: 0.01,
    status: "trading",
  },
  {
    symbol: "XRP-USDT",
    base: "XRP",
    quote: "USDT",
    displayName: "XRP",
    pricePrecision: 4,
    qtyPrecision: 1,
    minQty: 1,
    status: "trading",
  },
  {
    symbol: "DOGE-USDT",
    base: "DOGE",
    quote: "USDT",
    displayName: "Dogecoin",
    pricePrecision: 5,
    qtyPrecision: 0,
    minQty: 10,
    status: "trading",
  },
];

const BASE_PRICES: Record<string, number> = {
  "BTC-USDT": 65432.1,
  "ETH-USDT": 3421.55,
  "SOL-USDT": 142.882,
  "BNB-USDT": 598.42,
  "XRP-USDT": 0.5123,
  "DOGE-USDT": 0.12456,
};

function seedFromSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function createInitialTickers(): Record<string, Ticker> {
  const out: Record<string, Ticker> = {};
  for (const s of MOCK_SYMBOLS) {
    const last = BASE_PRICES[s.symbol] ?? 100;
    const change = ((seedFromSymbol(s.symbol) % 800) - 400) / 100;
    out[s.symbol] = {
      symbol: s.symbol,
      last,
      change24h: change,
      high24h: last * (1 + Math.abs(change) / 100 + 0.02),
      low24h: last * (1 - Math.abs(change) / 100 - 0.02),
      volume24h: 12000 + (seedFromSymbol(s.symbol) % 50000),
      quoteVolume24h: last * (12000 + (seedFromSymbol(s.symbol) % 50000)),
    };
  }
  return out;
}

export function jitterTicker(ticker: Ticker): Ticker {
  const drift = (Math.random() - 0.5) * ticker.last * 0.0008;
  const last = Math.max(ticker.last * 0.5, ticker.last + drift);
  const change24h = ticker.change24h + (Math.random() - 0.5) * 0.02;
  return {
    ...ticker,
    last,
    change24h,
    high24h: Math.max(ticker.high24h, last),
    low24h: Math.min(ticker.low24h, last),
    volume24h: ticker.volume24h + Math.random() * 2,
    quoteVolume24h: ticker.quoteVolume24h + Math.random() * last,
  };
}

export function buildOrderBook(mid: number, levels = 36): OrderBook {
  const step = mid > 1000 ? 0.5 : mid > 10 ? 0.01 : 0.0001;
  const bids = Array.from({ length: levels }, (_, i) => {
    const price = mid - step * (i + 1);
    return { price, qty: Math.random() * 3 + 0.05 };
  });
  const asks = Array.from({ length: levels }, (_, i) => {
    const price = mid + step * (i + 1);
    return { price, qty: Math.random() * 3 + 0.05 };
  });
  return { bids, asks };
}

export function buildRecentTrades(mid: number, symbol: string, count = 40): MarketTrade[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const side = Math.random() > 0.5 ? "buy" : "sell";
    return {
      id: `${symbol}-${now - i * 1200}`,
      price: mid + (Math.random() - 0.5) * mid * 0.001,
      qty: Math.random() * 0.5 + 0.01,
      side,
      ts: now - i * 1200,
    };
  });
}

export function buildKlines(
  symbol: string,
  intervalMinutes: number,
  count = 200,
): KlineBar[] {
  const base = BASE_PRICES[symbol] ?? 100;
  const seed = seedFromSymbol(symbol + intervalMinutes);
  const bars: KlineBar[] = [];
  let close = base * (0.97 + (seed % 60) / 1000);
  const ms = intervalMinutes * 60_000;
  const start = Date.now() - count * ms;
  const volScale = base * 0.0018;

  for (let i = 0; i < count; i++) {
    const open = close;
    // Random walk with mild mean-reversion — looks like real price action
    const reversion = (base - close) * 0.018;
    const shock = (Math.random() - 0.5) * volScale * (0.6 + Math.random());
    close = Math.max(base * 0.72, Math.min(base * 1.28, open + reversion + shock));
    const wick = volScale * (0.15 + Math.random() * 0.45);
    const high = Math.max(open, close) + wick * Math.random();
    const low = Math.min(open, close) - wick * Math.random();
    bars.push({
      time: start + i * ms,
      open,
      high,
      low,
      close,
      volume: Math.random() * 80 + 5,
    });
  }
  return bars;
}

export const INITIAL_BALANCES: Balance[] = [
  { currency: "USDT", available: 50_000, frozen: 1_250.5 },
  { currency: "BTC", available: 0.8421, frozen: 0.015 },
  { currency: "ETH", available: 12.55, frozen: 0 },
  { currency: "SOL", available: 120.5, frozen: 5 },
];

export const INITIAL_OPEN_ORDERS: ExchangeOrder[] = [
  {
    id: "ord-1001",
    symbol: "BTC-USDT",
    side: "buy",
    type: "limit",
    price: 64800,
    quantity: 0.05,
    filledQuantity: 0,
    status: "open",
    createdAt: Date.now() - 3600_000,
  },
  {
    id: "ord-1002",
    symbol: "ETH-USDT",
    side: "sell",
    type: "limit",
    price: 3500,
    quantity: 2,
    filledQuantity: 0.5,
    status: "partial",
    createdAt: Date.now() - 7200_000,
  },
];

export const INITIAL_ORDER_HISTORY: ExchangeOrder[] = [
  {
    id: "ord-0998",
    symbol: "SOL-USDT",
    side: "buy",
    type: "market",
    price: null,
    quantity: 50,
    filledQuantity: 50,
    status: "filled",
    createdAt: Date.now() - 86_400_000,
  },
  {
    id: "ord-0999",
    symbol: "BTC-USDT",
    side: "sell",
    type: "limit",
    price: 66000,
    quantity: 0.1,
    filledQuantity: 0,
    status: "cancelled",
    createdAt: Date.now() - 172_800_000,
  },
];

export const INITIAL_USER_TRADES: UserTrade[] = [
  {
    id: "trd-501",
    orderId: "ord-0998",
    symbol: "SOL-USDT",
    side: "buy",
    price: 141.2,
    quantity: 50,
    fee: 3.53,
    feeCurrency: "USDT",
    role: "taker",
    ts: Date.now() - 86_000_000,
  },
  {
    id: "trd-502",
    orderId: "ord-1002",
    symbol: "ETH-USDT",
    side: "sell",
    price: 3488,
    quantity: 0.5,
    fee: 1.74,
    feeCurrency: "USDT",
    role: "maker",
    ts: Date.now() - 3600_000,
  },
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: "lg-1",
    currency: "USDT",
    type: "credit",
    amount: 50000,
    balanceAfter: 50000,
    refId: "demo-credit",
    ts: Date.now() - 604_800_000,
  },
  {
    id: "lg-2",
    currency: "USDT",
    type: "freeze",
    amount: -1250.5,
    balanceAfter: 48749.5,
    refId: "ord-1001",
    ts: Date.now() - 3600_000,
  },
  {
    id: "lg-3",
    currency: "SOL",
    type: "trade",
    amount: 50,
    balanceAfter: 120.5,
    refId: "trd-501",
    ts: Date.now() - 86_000_000,
  },
  {
    id: "lg-4",
    currency: "USDT",
    type: "fee",
    amount: -3.53,
    balanceAfter: 48745.97,
    refId: "trd-501",
    ts: Date.now() - 86_000_000,
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    titleZh: "Velora 现货交易内测开启",
    titleEn: "Velora Spot Trading Internal Beta",
    summaryZh: "欢迎参与 Velora Focus Deck 交易终端内测。",
    summaryEn: "Welcome to the Velora Focus Deck trading terminal beta.",
    contentZh:
      "Velora 现货交易内测现已开放。内测期间使用模拟资产，不涉及真实资金。如有问题请通过帮助中心反馈。",
    contentEn:
      "Velora spot trading beta is now open. Simulated assets only — no real funds during internal testing.",
    category: "listing",
    publishedAt: Date.now() - 86_400_000,
  },
  {
    id: "ann-2",
    titleZh: "系统维护通知",
    titleEn: "Scheduled Maintenance",
    summaryZh: "本周六 02:00–04:00 (UTC+8) 进行例行维护。",
    summaryEn: "Routine maintenance Sat 02:00–04:00 (UTC+8).",
    contentZh: "维护期间行情与交易可能短暂不可用，请提前管理仓位。",
    contentEn: "Market data and trading may be briefly unavailable.",
    category: "maintenance",
    publishedAt: Date.now() - 259_200_000,
  },
  {
    id: "ann-3",
    titleZh: "风险提示",
    titleEn: "Risk Disclosure",
    summaryZh: "数字资产交易具有高风险，请谨慎参与。",
    summaryEn: "Crypto trading involves significant risk.",
    contentZh: "请您充分了解数字资产相关风险，理性投资。",
    contentEn: "Please understand crypto risks and trade responsibly.",
    category: "risk",
    publishedAt: Date.now() - 432_000_000,
  },
];

export function getSymbolMeta(symbol: string): MarketSymbol | undefined {
  return MOCK_SYMBOLS.find((s) => s.symbol === symbol);
}

export function symbolToUrl(symbol: string): string {
  return symbol.replace("/", "-");
}

export function urlToSymbol(param: string): string {
  return param.toUpperCase();
}
