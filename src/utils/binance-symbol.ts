/** Binance BTCUSDT → Velora BTC-USDT */
export function binanceToVeloraSymbol(upstream: string): string {
  const upper = upstream.trim().toUpperCase();
  const quotes = ["USDT", "USDC", "FDUSD", "BUSD", "TUSD", "BTC", "ETH", "BNB"];
  for (const q of quotes) {
    if (upper.endsWith(q) && upper.length > q.length) {
      return `${upper.slice(0, -q.length)}-${q}`;
    }
  }
  return upper;
}

/** Velora BTC-USDT → Binance BTCUSDT */
export function veloraToBinanceSymbol(velora: string): string {
  return velora.replace(/-/g, "").toUpperCase();
}
