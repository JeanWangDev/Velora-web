"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMarketStore } from "@/stores/use-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { getSpotSymbols } from "@/stores/use-symbol-registry";
import { CoinIcon } from "@/components/exchange/coin-icon";
import { PriceChange } from "@/components/exchange/price-change";
import { formatPrice } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";
import { useExchangeT } from "@/hooks/use-exchange-t";

import { filterSymbolsByCategory, type SymbolCategory } from "@/utils/symbol-category-filter";
import {
  MARKET_LIST_GRID,
  MARKET_LIST_HEADER_NUM,
  MARKET_LIST_NUM_CELL,
} from "@/components/exchange/market-list-grid";

type Cat = SymbolCategory;
type SortKey = "pair" | "price" | "change";

function SortHead({
  k, label, className, sortKey, sortAsc, onToggle, align = "start",
}: {
  k: SortKey; label: string; className?: string;
  sortKey: SortKey; sortAsc: boolean; onToggle: (k: SortKey) => void;
  align?: "start" | "end";
}) {
  const active = sortKey === k;
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cn(
        "flex items-center gap-0.5 text-[10px] transition",
        align === "end" && MARKET_LIST_HEADER_NUM,
        active
          ? "text-[var(--terminal-accent)]"
          : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
        className,
      )}
    >
      {label}
      <span className="flex flex-col leading-none text-[8px] opacity-60">
        <span className={active && sortAsc ? "text-[var(--terminal-accent)] opacity-100" : ""}>▲</span>
        <span className={active && !sortAsc ? "text-[var(--terminal-accent)] opacity-100" : ""}>▼</span>
      </span>
    </button>
  );
}

export function MarketSidePanel({ currentSymbol }: { currentSymbol: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useExchangeT();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortAsc, setSortAsc] = useState(false);
  const tickers = useMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const toggle = useWatchlistStore((s) => s.toggle);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const cats: { key: Cat; label: string; star?: boolean }[] = [
    { key: "watch", label: t("markets.watchlist"), star: true },
    { key: "all", label: t("trade.categories.all") },
    { key: "main", label: t("trade.categories.main") },
    { key: "meme", label: t("trade.categories.meme") },
    { key: "platform", label: t("trade.categories.platform") },
    { key: "ai", label: t("trade.categories.ai") },
    { key: "new", label: t("trade.categories.new") },
  ];

  const rows = useMemo(() => {
    let list = filterSymbolsByCategory(getSpotSymbols(), cat, watchlist).filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.base.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      const ta = tickers[a.symbol], tb = tickers[b.symbol];
      if (!ta && !tb) return a.symbol.localeCompare(b.symbol);
      if (!ta) return 1;
      if (!tb) return -1;
      let cmp = 0;
      if (sortKey === "pair")     cmp = a.symbol.localeCompare(b.symbol);
      if (sortKey === "price")    cmp = ta.last - tb.last;
      if (sortKey === "change")   cmp = ta.change24h - tb.change24h;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [cat, search, tickers, watchlist, sortKey, sortAsc]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--terminal-bg)] text-[var(--terminal-text)]">
      {/* 搜索 */}
      <div className="shrink-0 p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--terminal-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("markets.search")}
            className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-panel)] py-1.5 pl-8 pr-3 text-xs text-[var(--terminal-text)] outline-none placeholder:text-[var(--terminal-muted)]"
          />
        </div>
      </div>

      {/* 分类 Tab（横向滚动） */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-2 pb-2">
        {cats.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              cat === c.key
                ? "bg-[var(--terminal-accent)] text-white"
                : "text-[var(--terminal-muted)] hover:bg-[var(--terminal-panel)] hover:text-[var(--terminal-text)]",
            )}
          >
            {c.star && (
              <Star className={cn(
                "h-3 w-3",
                cat === c.key ? "fill-white text-white" : "text-[var(--terminal-muted)]",
              )} />
            )}
            {c.label}
          </button>
        ))}
        <span className="shrink-0 text-[var(--terminal-muted)]">
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* 列头 */}
      <div className={cn(MARKET_LIST_GRID, "shrink-0 border-b border-[var(--terminal-border)] px-2 py-1.5")}>
        <SortHead k="pair" label={t("markets.pair")} sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
        <SortHead k="price" label={t("markets.price")} align="end" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
        <SortHead k="change" label={t("markets.change")} align="end" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
      </div>

      {/* 列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-[var(--terminal-muted)]">{t("common.noData")}</p>
        )}
        {rows.map((s) => {
          const tk = tickers[s.symbol];
          const active = s.symbol === currentSymbol;
          return (
            <div
              key={s.symbol}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/trade/${s.symbol}`)}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/trade/${s.symbol}`); }}
              className={cn(
                MARKET_LIST_GRID,
                "cursor-pointer px-2 py-2 text-xs transition",
                active ? "bg-[var(--terminal-accent)]/10" : "hover:bg-[var(--terminal-panel)]",
              )}
            >
              {/* 名称列 */}
              <span className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(s.symbol); }}
                  className="shrink-0"
                >
                  <Star className={cn(
                    "h-3 w-3 transition",
                    watchlist.includes(s.symbol)
                      ? "fill-amber-400 text-amber-400"
                      : "text-[var(--terminal-muted)] hover:text-amber-400",
                  )} />
                </button>
                <CoinIcon base={s.base} size="xs" />
                <span className={cn(
                  "truncate font-medium",
                  active ? "text-[var(--terminal-accent)]" : "text-[var(--terminal-text)]",
                )}>
                  {s.base}<span className="text-[var(--terminal-muted)]">/{s.quote}</span>
                </span>
              </span>

              {/* 最新价 */}
              <span className={cn(MARKET_LIST_NUM_CELL, "text-[var(--terminal-text)]")}>
                {tk ? formatPrice(tk.last, s.pricePrecision, locale) : "—"}
              </span>

              <PriceChange
                value={tk?.change24h ?? 0}
                className={cn(MARKET_LIST_NUM_CELL, "text-[11px]")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
