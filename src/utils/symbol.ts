const QUOTE_SUFFIXES = ["USDT", "USDC", "FDUSD", "BUSD", "BTC", "ETH", "BNB"] as const;

/** 基础币 → 交易对（默认 USDT） */
export function baseToTradingPair(baseAsset: string, quote = "USDT"): string {
  const base = baseAsset.trim().toUpperCase().replace(/USDT$/i, "");
  if (!base) return `BTC${quote}`;
  return `${base}${quote}`;
}

/** 交易对 → 计价币（按常见后缀推断） */
export function quoteFromTradingPair(pair: string): string {
  const value = pair.trim().toUpperCase();
  for (const quote of QUOTE_SUFFIXES) {
    if (value.endsWith(quote) && value.length > quote.length) {
      return quote;
    }
  }
  return "USDT";
}

/** 交易对 → 基础币（API / 筛选） */
export function baseFromTradingPair(pair: string): string {
  const value = pair.trim().toUpperCase();
  if (!value) return "BTC";
  const quote = quoteFromTradingPair(value);
  const base = value.slice(0, -quote.length);
  return base || "BTC";
}

/** 现货路由 symbol → 永续合约 instId（如 BTC-USDT → BTC-USDT-SWAP） */
export function spotToFuturesInstId(spotSymbol: string): string {
  const upper = spotSymbol.trim().toUpperCase();
  if (upper.endsWith("-SWAP")) return upper;
  return `${upper}-SWAP`;
}

/** 永续合约 instId → 现货路由 symbol */
export function futuresInstIdToSpot(instId: string): string {
  const upper = instId.trim().toUpperCase();
  if (upper.endsWith("-SWAP")) return upper.slice(0, -"-SWAP".length);
  return upper;
}

/** 比较现货路由与合约 instId 是否同一品种 */
export function futuresSymbolsEqual(a: string, b: string): boolean {
  return futuresInstIdToSpot(a) === futuresInstIdToSpot(b);
}

/** 校验是否为合法交易对字符串 */
export function normalizeTradingPair(
  pair: string | null | undefined,
  allowed: string[],
  fallback = "BTCUSDT",
): string {
  const normalized = (pair ?? "").trim().toUpperCase();
  if (normalized && allowed.includes(normalized)) {
    return normalized;
  }
  return fallback;
}
