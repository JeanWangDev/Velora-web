"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MarketDataService } from "@/services/market-data-service";
import { getMarketStreamClient } from "@/services/market-stream-client";
import type { ITicker24h } from "@/types/market";
import { formatTickerPrice, formatTickerVolume } from "@/utils/format-market";
import { baseFromTradingPair, quoteFromTradingPair } from "@/utils/symbol";
import { useTranslation } from "@/i18n/use-translation";

type TradePriceStripProps = {
  tradingPair: string;
  exchange?: string;
};

export function TradePriceStrip({
  tradingPair,
  exchange = "binance",
}: TradePriceStripProps) {
  const t = useTranslation();
  const [ticker, setTicker] = useState<ITicker24h | null>(null);
  const [loading, setLoading] = useState(true);

  const base = baseFromTradingPair(tradingPair);
  const quote = quoteFromTradingPair(tradingPair);

  // REST snapshot on symbol change — instant paint before WS connects.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await MarketDataService.getTicker24h(tradingPair, exchange);
        if (!cancelled) {
          setTicker(data);
        }
      } catch {
        if (!cancelled) setTicker(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tradingPair, exchange]);

  // Live 24h ticker via WebSocket (~1s on Binance).
  useEffect(() => {
    let cancelled = false;
    const stream = getMarketStreamClient();
    const unsubscribe = stream.subscribeTicker(exchange, tradingPair, (next) => {
      if (cancelled) return;
      setTicker(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [tradingPair, exchange]);

  if (loading && !ticker) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </div>
    );
  }

  if (!ticker) return null;

  const up = ticker.priceChangePercent >= 0;

  return (
    <div className="flex min-w-0 flex-1 overflow-x-auto">
      <div className="flex shrink-0 items-center gap-x-3 gap-y-1 whitespace-nowrap py-0.5 text-xs sm:gap-x-4 sm:text-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tabular-nums text-foreground sm:text-lg">
            {formatTickerPrice(ticker.lastPrice, tradingPair)}
          </span>
          <span
            className={`text-xs font-medium tabular-nums sm:text-sm ${
              up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {up ? "+" : ""}
            {formatTickerPrice(ticker.priceChange, tradingPair)}{" "}
            ({up ? "+" : ""}
            {ticker.priceChangePercent.toFixed(2)}%)
          </span>
        </div>

        <span className="hidden h-4 w-px bg-border sm:inline-block" />

        <StatItem
          label={t("trade.ticker.high24h")}
          value={formatTickerPrice(ticker.highPrice, tradingPair)}
        />
        <StatItem
          label={t("trade.ticker.low24h")}
          value={formatTickerPrice(ticker.lowPrice, tradingPair)}
        />
        <StatItem
          label={t("trade.ticker.vol24h")}
          value={`${formatTickerVolume(ticker.volume)} ${base}`}
        />
        <StatItem
          label={t("trade.ticker.quoteVol24h")}
          value={`${formatTickerVolume(ticker.quoteVolume)} ${quote}`}
          className="hidden md:inline-flex"
        />

        <span className="hidden text-[11px] text-muted lg:inline">
          {base}/{quote}
        </span>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[10px] text-muted sm:text-[11px]">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
