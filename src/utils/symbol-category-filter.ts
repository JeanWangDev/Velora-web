import type { MarketSymbol } from "@/types/exchange";

export type SymbolCategory =
  | "watch"
  | "all"
  | "main"
  | "meme"
  | "platform"
  | "ai"
  | "new";

/** 分类 Tab 仅做展示分组；非自选 Tab 默认展示全部 Binance USDT 现货 */
export function filterSymbolsByCategory(
  symbols: MarketSymbol[],
  cat: SymbolCategory,
  watchlist: string[],
): MarketSymbol[] {
  if (cat === "watch") {
    return symbols.filter((s) => watchlist.includes(s.symbol));
  }
  return symbols;
}
