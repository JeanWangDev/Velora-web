"use client";

import Link from "next/link";
import { NetworkStatusBadge } from "@/components/exchange/network-status-badge";
import { getSpotSymbols } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { useLocale } from "@/i18n/use-translation";
import { displayPair, formatPrice } from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";

export function TickerTape() {
  const tickers = useMarketStore((s) => s.tickers);
  const locale = useLocale();
  const items = [...getSpotSymbols(), ...getSpotSymbols()];

  return (
    <div className="terminal-panel flex shrink-0 items-center overflow-hidden border-t border-[var(--terminal-border)] bg-black py-1">
      <div className="flex shrink-0 items-center border-r border-[var(--terminal-border)] px-3">
        <NetworkStatusBadge />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-animate flex w-max gap-6 px-4">
          {items.map((s, i) => {
            const tk = tickers[s.symbol];
            if (!tk) return null;
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
      </div>
    </div>
  );
}
