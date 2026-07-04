"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import type { Ticker } from "@/types/exchange";
import {
  displayPair,
  formatCompact,
  formatPrice,
} from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";

export function SymbolStrip({
  ticker,
}: {
  ticker: Ticker;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(ticker.symbol);
  const toggle = useWatchlistStore((s) => s.toggle);
  const watched = useWatchlistStore((s) => s.isWatched(ticker.symbol));

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(ticker.symbol)}
          className="text-muted hover:text-accent"
          aria-label="watchlist"
        >
          <Star
            className={`h-4 w-4 ${watched ? "fill-accent text-accent" : ""}`}
          />
        </button>
        <div>
          <Link
            href={`/trade/${ticker.symbol}`}
            className="text-lg font-semibold tracking-tight"
          >
            {displayPair(ticker.symbol)}
          </Link>
          <p className="text-xs text-muted">{meta?.displayName}</p>
        </div>
      </div>

      <div className="font-mono text-2xl font-semibold tabular-nums">
        {formatPrice(ticker.last, meta?.pricePrecision ?? 2, locale)}
      </div>

      <PriceChange value={ticker.change24h} className="text-sm" />

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span>
          {t("trade.high24h")}{" "}
          <b className="text-foreground tabular-nums">
            {formatPrice(ticker.high24h, meta?.pricePrecision ?? 2, locale)}
          </b>
        </span>
        <span>
          {t("trade.low24h")}{" "}
          <b className="text-foreground tabular-nums">
            {formatPrice(ticker.low24h, meta?.pricePrecision ?? 2, locale)}
          </b>
        </span>
        <span>
          {t("trade.vol24h")}{" "}
          <b className="text-foreground tabular-nums">
            {formatCompact(ticker.volume24h, locale)} {meta?.base}
          </b>
        </span>
      </div>

      <span className="ml-auto rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-medium text-up">
        SPOT
      </span>
    </div>
  );
}
