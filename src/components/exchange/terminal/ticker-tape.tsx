"use client";

import Link from "next/link";
import { Wifi } from "lucide-react";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useLocale } from "@/i18n/use-translation";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { displayPair, formatPrice } from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";

export function TickerTape() {
  const tickers = useMockMarketStore((s) => s.tickers);
  const locale = useLocale();
  const t = useExchangeT();
  const items = [...MOCK_SYMBOLS, ...MOCK_SYMBOLS];

  return (
    <div className="terminal-panel flex shrink-0 items-center overflow-hidden border-t border-[var(--terminal-border)] bg-black py-1">
      <div className="flex shrink-0 items-center gap-1.5 border-r border-[var(--terminal-border)] px-3 text-[10px] text-up">
        <Wifi className="h-3 w-3" />
        {t("trade.networkStable")}
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
