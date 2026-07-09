"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { CoinIcon } from "@/components/exchange/coin-icon";
import { PriceChange } from "@/components/exchange/price-change";
import { formatPrice, formatCompact } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";

type Cat = "watch" | "all" | "main" | "meme" | "platform" | "ai" | "new";
type SortKey = "pair" | "price" | "change" | "turnover";

function SortHead({
  k, label, className, sortKey, sortAsc, onToggle,
}: {
  k: SortKey; label: string; className?: string;
  sortKey: SortKey; sortAsc: boolean; onToggle: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] transition",
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
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [sortKey, setSortKey] = useState<SortKey>("turnover");
  const [sortAsc, setSortAsc] = useState(false);
  const tickers = useMockMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const toggle = useWatchlistStore((s) => s.toggle);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const cats: { key: Cat; label: string; star?: boolean }[] = [
    { key: "watch", label: "自选", star: true },
    { key: "all",      label: "全部" },
    { key: "main",     label: "主流" },
    { key: "meme",     label: "Meme" },
    { key: "platform", label: "平台币" },
    { key: "ai",       label: "AI" },
    { key: "new",      label: "新币" },
  ];

  const rows = useMemo(() => {
    let list = MOCK_SYMBOLS.filter((s) => {
      if (cat === "watch" && !watchlist.includes(s.symbol)) return false;
      if (cat === "main" && !["BTC-USDT","ETH-USDT","SOL-USDT"].includes(s.symbol)) return false;
      if (cat === "new" && !["DOGE-USDT","XRP-USDT"].includes(s.symbol)) return false;
      if (cat === "ai" && s.symbol !== "SOL-USDT") return false;
      if (cat === "meme" && s.symbol !== "DOGE-USDT") return false;
      if (cat === "platform" && s.symbol !== "BNB-USDT") return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.base.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      const ta = tickers[a.symbol], tb = tickers[b.symbol];
      if (!ta || !tb) return 0;
      let cmp = 0;
      if (sortKey === "pair")     cmp = a.symbol.localeCompare(b.symbol);
      if (sortKey === "price")    cmp = ta.last - tb.last;
      if (sortKey === "change")   cmp = ta.change24h - tb.change24h;
      if (sortKey === "turnover") cmp = ta.quoteVolume24h - tb.quoteVolume24h;
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
            placeholder="搜索"
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
      <div className="grid shrink-0 grid-cols-[minmax(0,1.4fr)_minmax(64px,auto)_minmax(52px,auto)_minmax(56px,auto)] items-center gap-x-1.5 border-b border-[var(--terminal-border)] px-2 py-1.5">
        <SortHead k="pair" label={locale === "zh" ? "名称" : "Name"} sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
        <SortHead k="price" label={locale === "zh" ? "最新价" : "Price"} className="justify-end" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
        <SortHead k="change" label={locale === "zh" ? "涨跌幅" : "24H%"} className="justify-end" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
        <SortHead k="turnover" label={locale === "zh" ? "成交额" : "Vol"} className="justify-end" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
      </div>

      {/* 列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-[var(--terminal-muted)]">暂无数据</p>
        )}
        {rows.map((s) => {
          const tk = tickers[s.symbol];
          if (!tk) return null;
          const active = s.symbol === currentSymbol;
          return (
            <div
              key={s.symbol}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/trade/${s.symbol}`)}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(`/trade/${s.symbol}`); }}
              className={cn(
                "grid cursor-pointer grid-cols-[minmax(0,1.4fr)_minmax(64px,auto)_minmax(52px,auto)_minmax(56px,auto)] items-center gap-x-1.5 px-2 py-2 text-xs transition",
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
              <span className="font-mono tabular-nums text-[var(--terminal-text)]">
                {formatPrice(tk.last, s.pricePrecision, locale)}
              </span>

              {/* 涨跌幅 */}
              <PriceChange value={tk.change24h} className="justify-end text-[11px]" />

              {/* 成交额 */}
              <span className="font-mono tabular-nums text-[var(--terminal-muted)]">
                {formatCompact(tk.quoteVolume24h, locale)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
