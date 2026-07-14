"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { NetworkStatusBadge } from "@/components/exchange/network-status-badge";
import { PriceChange } from "@/components/exchange/price-change";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { getSpotSymbols } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { displayPair, formatPrice } from "@/utils/format-exchange";

/** 单份列表滚动完大约每条耗时；列表越长总时长越大，像素速度保持可读 */
const SECONDS_PER_ITEM = 3.2;
const MIN_DURATION_SEC = 48;
const MAX_TAPE_SYMBOLS = 40;
const FALLBACK_SYMBOLS = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "BNB-USDT", "XRP-USDT"];

export function TickerTape() {
  const t = useExchangeT();
  const tickers = useMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const locale = useLocale();
  const spot = getSpotSymbols();
  const bySymbol = new Map(spot.map((s) => [s.symbol, s]));

  const preferred = (watchlist.length > 0 ? watchlist : FALLBACK_SYMBOLS)
    .map((sym) => bySymbol.get(sym))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .filter((s) => Boolean(tickers[s.symbol]))
    .slice(0, MAX_TAPE_SYMBOLS);

  const withTickers =
    preferred.length > 0
      ? preferred
      : spot
          .filter((s) => Boolean(tickers[s.symbol]))
          .slice(0, MAX_TAPE_SYMBOLS);

  const unique = withTickers;
  // 无缝循环：两份相同内容，keyframes 位移 -50%
  const items = [...unique, ...unique];
  const durationSec = Math.max(
    MIN_DURATION_SEC,
    Math.round(unique.length * SECONDS_PER_ITEM),
  );

  return (
    <div className="terminal-panel flex shrink-0 items-center overflow-hidden border-t border-[var(--terminal-border)] bg-black py-1">
      <div className="flex shrink-0 items-center gap-2 border-r border-[var(--terminal-border)] px-3">
        <NetworkStatusBadge />
        <span className="inline-flex items-center gap-1 text-[10px] text-accent">
          <Star className="h-3 w-3 fill-current" />
          {t("markets.watchlist")}
        </span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        {unique.length === 0 ? (
          <div className="px-4 py-0.5 text-[11px] text-muted">{t("common.noData")}</div>
        ) : (
          <div
            className="ticker-animate flex w-max gap-6 px-4"
            style={{ animationDuration: `${durationSec}s` }}
          >
            {items.map((s, i) => {
              const tk = tickers[s.symbol]!;
              return (
                <Link
                  key={`${s.symbol}-${i}`}
                  href={`/trade/${s.symbol}`}
                  className="flex items-center gap-2 whitespace-nowrap text-[11px] hover:text-accent"
                >
                  <span className="font-medium">{displayPair(s.symbol)}</span>
                  <PriceChange value={tk.change24h} className="text-[10px]" />
                  <span className="font-mono tabular-nums text-foreground">
                    {formatPrice(tk.last, s.pricePrecision, locale)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
