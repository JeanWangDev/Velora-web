"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { getSpotSymbols } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { useTerminalStore } from "@/stores/use-terminal-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import {
  displayPair,
  formatPrice,
} from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";
import { cn } from "@/lib/cn";

import type { TradeMode } from "@/stores/use-trade-mode-store";

type MarketFilter = "all" | "watch" | "main";

export function MarketRail({
  activeSymbol,
  mode = "spot",
}: {
  activeSymbol: string;
  mode?: TradeMode;
}) {
  const basePath = mode === "futures" ? "/futures" : "/trade";
  const t = useExchangeT();
  const locale = useLocale();
  const open = useTerminalStore((s) => s.marketRailOpen);
  const toggle = useTerminalStore((s) => s.toggleMarketRail);
  const tickers = useMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const toggleWatch = useWatchlistStore((s) => s.toggle);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MarketFilter>("all");

  const rows = useMemo(() => {
    return getSpotSymbols().filter((s) => {
      if (filter === "watch" && !watchlist.includes(s.symbol)) return false;
      if (filter === "main" && !["BTC-USDT", "ETH-USDT", "SOL-USDT"].includes(s.symbol))
        return false;
      if (!q) return true;
      const qq = q.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(qq) ||
        s.base.toLowerCase().includes(qq)
      );
    });
  }, [filter, q, watchlist]);

  if (!open) {
    return (
      <div className="terminal-panel flex w-9 shrink-0 flex-col items-center border-r border-[var(--terminal-border)] py-2">
        <button
          type="button"
          onClick={toggle}
          title={t("markets.title")}
          className="rounded p-1.5 text-muted hover:bg-[var(--terminal-panel-2)] hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="terminal-panel flex w-[220px] shrink-0 flex-col border-r border-[var(--terminal-border)]">
      <div className="flex items-center justify-between border-b border-[var(--terminal-border)] px-2 py-2">
        <span className="text-xs font-medium text-muted">{t("markets.title")}</span>
        <button
          type="button"
          onClick={toggle}
          className="rounded p-1 text-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[var(--terminal-border)] p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("markets.search")}
            className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-panel-2)] py-1.5 pl-7 pr-2 text-xs outline-none focus:border-primary/50"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {(
            [
              ["all", t("markets.all")],
              ["watch", t("markets.watchlist")],
              ["main", "Main"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "flex-1 rounded py-0.5 text-[10px]",
                filter === k
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="terminal-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[1fr_auto_auto] gap-1 px-2 py-1.5 text-[10px] text-muted">
          <span>{t("markets.pair")}</span>
          <span className="text-right">{t("markets.price")}</span>
          <span className="w-12 text-right">{t("markets.change")}</span>
        </div>
        {rows.map((s) => {
          const tk = tickers[s.symbol];
          if (!tk) return null;
          const active = s.symbol === activeSymbol;
          const watched = watchlist.includes(s.symbol);
          return (
            <Link
              key={s.symbol}
              href={`${basePath}/${s.symbol}`}
              className={cn(
                "grid grid-cols-[1fr_auto_auto] items-center gap-1 px-2 py-1.5 text-xs transition",
                active
                  ? "bg-primary/15"
                  : "hover:bg-[var(--terminal-panel-2)]",
              )}
            >
              <span className="flex items-center gap-1 truncate font-medium">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleWatch(s.symbol);
                  }}
                  className="shrink-0"
                >
                  <Star
                    className={cn(
                      "h-3 w-3",
                      watched ? "fill-accent text-accent" : "text-muted",
                    )}
                  />
                </button>
                {displayPair(s.symbol)}
              </span>
              <span className="font-mono tabular-nums">
                {formatPrice(tk.last, s.pricePrecision, locale)}
              </span>
              <PriceChange
                value={tk.change24h}
                className="w-12 justify-end text-[10px]"
              />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
