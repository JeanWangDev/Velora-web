/**
 * Binance-style market number formatting: truncate (never round), locale grouping.
 */

/** Truncate toward zero and format with fixed decimal places. */
export function truncateFixed(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return "—";

  const safeDecimals = Math.max(0, Math.min(decimals, 12));
  const factor = 10 ** safeDecimals;
  const truncated = Math.trunc(value * factor) / factor;
  const fixed = truncated.toFixed(safeDecimals);
  const [intPart, fracPart] = fixed.split(".");

  const intFormatted = Number(intPart).toLocaleString("en-US");
  return fracPart !== undefined ? `${intFormatted}.${fracPart}` : intFormatted;
}

/** Infer quote-asset price decimals for ticker display (matches Binance header). */
export function getTickerPriceDecimals(symbol: string): number {
  const upper = symbol.toUpperCase();
  if (upper.endsWith("USDT") || upper.endsWith("USDC") || upper.endsWith("BUSD")) {
    if (upper.startsWith("BTC") || upper.startsWith("ETH") || upper.startsWith("BNB")) {
      return 2;
    }
    if (
      upper.startsWith("DOGE") ||
      upper.startsWith("SHIB") ||
      upper.startsWith("PEPE")
    ) {
      return 6;
    }
    return 4;
  }
  if (upper.endsWith("BTC")) return 8;
  return 2;
}

/** Binance ticker header uses 2 decimals for 24h base/quote volume. */
export const TICKER_VOLUME_DECIMALS = 2;

export const TICKER_PERCENT_DECIMALS = 2;

export function formatTickerPrice(value: number, symbol: string): string {
  return truncateFixed(value, getTickerPriceDecimals(symbol));
}

export function formatTickerVolume(value: number): string {
  return truncateFixed(value, TICKER_VOLUME_DECIMALS);
}

export function formatTickerPercent(value: number): string {
  const truncated = truncateFixed(value, TICKER_PERCENT_DECIMALS);
  return value >= 0 ? `+${truncated}%` : `${truncated}%`;
}

export function formatTickerChange(value: number, symbol: string): string {
  const formatted = formatTickerPrice(Math.abs(value), symbol);
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}
