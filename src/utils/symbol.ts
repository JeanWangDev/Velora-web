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
