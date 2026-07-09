"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { formatPrice, formatPercent } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";

const COIN_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff",
  BNB: "#f0b90b", XRP: "#00aae4", DOGE: "#c2a633",
};

export function SymbolListPanel({ currentSymbol }: { currentSymbol: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const tickers = useMockMarketStore((s) => s.tickers);
  const isWatched = useWatchlistStore((s) => s.isWatched);
  const toggle = useWatchlistStore((s) => s.toggle);

  const rows = useMemo(() => {
    const q = search.toUpperCase();
    return MOCK_SYMBOLS.filter((s) =>
      !q || s.base.includes(q) || s.symbol.includes(q),
    ).map((s) => ({ ...s, ticker: tickers[s.symbol] }));
  }, [search, tickers]);

  return (
    <div className="flex h-full flex-col bg-[var(--terminal-bg)]">
      {/* 标题 */}
      <div className="flex shrink-0 items-center border-b border-[var(--terminal-border)] px-2 py-2">
        <span className="text-[11px] font-semibold text-[var(--terminal-muted)] uppercase tracking-wide">
          币对
        </span>
      </div>

      {/* 搜索 */}
      <div className="shrink-0 p-2">
        <div className="flex items-center gap-1.5 rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-panel)] px-2 py-1.5">
          <Search className="h-3 w-3 shrink-0 text-[var(--terminal-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--terminal-text)] outline-none placeholder:text-[var(--terminal-muted)]"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((row) => {
          const active = row.symbol === currentSymbol;
          const up = (row.ticker?.change24h ?? 0) >= 0;
          const coinColor = COIN_COLORS[row.base] ?? "#6b7280";
          const changeColor = up ? "text-up" : "text-down";

          return (
            <div
              key={row.symbol}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/trade/${row.symbol}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/trade/${row.symbol}`);
              }}
              className={cn(
                "group flex cursor-pointer items-center gap-1.5 px-2 py-2 transition-colors",
                active
                  ? "bg-[var(--terminal-accent)]/10"
                  : "hover:bg-[var(--terminal-panel)]",
              )}
            >
              {/* 星标 */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(row.symbol); }}
                className="shrink-0 text-[var(--terminal-muted)] hover:text-amber-400"
              >
                <Star
                  className={cn(
                    "h-3 w-3",
                    isWatched(row.symbol) && "fill-amber-400 text-amber-400",
                  )}
                />
              </button>

              {/* 图标 */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ background: coinColor, fontSize: 8 }}
              >
                {row.base.slice(0, 1)}
              </div>

              {/* 名称 + 价格涨跌 */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between">
                  <span className={cn(
                    "text-[11px] font-semibold leading-none",
                    active ? "text-[var(--terminal-accent)]" : "text-[var(--terminal-text)]",
                  )}>
                    {row.base}
                  </span>
                  <span className={cn("font-mono text-[10px] tabular-nums leading-none", changeColor)}>
                    {row.ticker ? formatPrice(row.ticker.last, row.pricePrecision, locale) : "--"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[9px] leading-none text-[var(--terminal-muted)]">
                    /{row.quote}
                  </span>
                  <span className={cn(
                    "rounded px-1 font-mono text-[9px] tabular-nums",
                    up ? "text-up" : "text-down",
                  )}>
                    {row.ticker ? formatPercent(row.ticker.change24h) : "--"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
