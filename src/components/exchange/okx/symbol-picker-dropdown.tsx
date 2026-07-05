"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Search, Star, Wifi } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale } from "@/i18n/use-translation";
import { LocaleLink } from "@/components/ui/locale-link";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import type { TradeMode } from "@/stores/use-trade-mode-store";
import {
  displayPair,
  formatCompact,
  formatPrice,
} from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";
import { cn } from "@/lib/cn";

type Cat = "watch" | "all" | "main" | "meme" | "platform" | "ai" | "new";
type SortKey = "pair" | "price" | "change" | "turnover";

const COIN_COLORS: Record<string, string> = {
  BTC: "bg-[#f7931a]",
  ETH: "bg-[#627eea]",
  SOL: "bg-[#9945ff]",
  BNB: "bg-[#f3ba2f]",
  DOGE: "bg-[#c2a633]",
  XRP: "bg-[#23292f]",
};

const PANEL_W = 420;
const PANEL_H = 460;

function SortHead({
  k,
  label,
  className,
  sortKey,
  sortAsc,
  onToggle,
}: {
  k: SortKey;
  label: string;
  className?: string;
  sortKey: SortKey;
  sortAsc: boolean;
  onToggle: (k: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] text-[#c8cdd6] hover:text-white",
        className,
      )}
    >
      {label}
      <span className="flex flex-col leading-none text-[8px] opacity-60">
        <span className={sortKey === k && sortAsc ? "text-white" : ""}>▲</span>
        <span className={sortKey === k && !sortAsc ? "text-white" : ""}>▼</span>
      </span>
    </button>
  );
}

export function SymbolPickerDropdown({
  symbol,
  mode,
}: {
  symbol: string;
  mode: TradeMode;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [sortKey, setSortKey] = useState<SortKey>("turnover");
  const [sortAsc, setSortAsc] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const mounted = useHydrated();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tickers = useMockMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const toggleWatch = useWatchlistStore((s) => s.toggle);
  const basePath = mode === "futures" ? "/futures" : "/trade";

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 4;
    // 防止超出视口右侧
    if (left + PANEL_W > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - PANEL_W - 8);
    }
    // 下方空间不够则向上展开
    if (top + PANEL_H > window.innerHeight - 8) {
      top = Math.max(8, rect.top - PANEL_H - 4);
    }
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cats: { key: Cat; label: string; star?: boolean }[] = [
    { key: "watch", label: t("markets.watchlist"), star: true },
    { key: "all", label: t("trade.categories.all") },
    { key: "main", label: t("trade.categories.main") },
    { key: "meme", label: t("trade.categories.meme") },
    {
      key: "platform",
      label: locale === "zh" ? "平台币" : "Platform",
    },
    { key: "ai", label: t("trade.categories.ai") },
    { key: "new", label: t("trade.categories.new") },
  ];

  const rows = useMemo(() => {
    let list = MOCK_SYMBOLS.filter((s) => {
      if (cat === "watch" && !watchlist.includes(s.symbol)) return false;
      if (
        cat === "main" &&
        !["BTC-USDT", "ETH-USDT", "SOL-USDT"].includes(s.symbol)
      )
        return false;
      if (cat === "new" && !["DOGE-USDT", "XRP-USDT"].includes(s.symbol))
        return false;
      if (cat === "ai" && s.symbol !== "SOL-USDT") return false;
      if (cat === "meme" && s.symbol !== "DOGE-USDT") return false;
      if (cat === "platform" && s.symbol !== "BNB-USDT") return false;
      if (!q) return true;
      const qq = q.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(qq) ||
        s.base.toLowerCase().includes(qq) ||
        s.displayName.toLowerCase().includes(qq)
      );
    });

    list = [...list].sort((a, b) => {
      const ta = tickers[a.symbol];
      const tb = tickers[b.symbol];
      if (!ta || !tb) return 0;
      let cmp = 0;
      if (sortKey === "pair") cmp = a.symbol.localeCompare(b.symbol);
      if (sortKey === "price") cmp = ta.last - tb.last;
      if (sortKey === "change") cmp = ta.change24h - tb.change24h;
      if (sortKey === "turnover") cmp = ta.quoteVolume24h - tb.quoteVolume24h;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [cat, q, watchlist, tickers, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={locale === "zh" ? "选择交易对" : "Select pair"}
            className="fixed z-[200] flex flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-2xl"
            style={{
              top: pos.top,
              left: pos.left,
              width: PANEL_W,
              height: PANEL_H,
            }}
          >
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={
                    locale === "zh"
                      ? "输入币种或合约地址"
                      : "Search coin or address"
                  }
                  className="w-full rounded-md border-0 bg-[#1c1c1c] py-2 pl-9 pr-3 text-xs text-foreground outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto px-3 pb-2">
              {cats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                    cat === c.key
                      ? "bg-white text-black"
                      : "bg-transparent text-muted hover:text-foreground",
                  )}
                >
                  {c.star && (
                    <Star
                      className={cn(
                        "h-3 w-3",
                        cat === c.key
                          ? "fill-black text-black"
                          : "text-muted",
                      )}
                    />
                  )}
                  {c.label}
                </button>
              ))}
              <span className="shrink-0 text-muted">
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr] gap-1 border-b border-[#2a2a2a] px-3 py-1.5">
              <SortHead
                k="pair"
                label={
                  mode === "futures"
                    ? locale === "zh"
                      ? "合约"
                      : "Perp"
                    : locale === "zh"
                      ? "现货"
                      : "Spot"
                }
                sortKey={sortKey}
                sortAsc={sortAsc}
                onToggle={toggleSort}
              />
              <SortHead
                k="price"
                label={locale === "zh" ? "最新价" : "Last"}
                className="justify-end"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onToggle={toggleSort}
              />
              <SortHead
                k="change"
                label={locale === "zh" ? "24H涨跌幅" : "24H %"}
                className="justify-end"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onToggle={toggleSort}
              />
              <SortHead
                k="turnover"
                label={locale === "zh" ? "成交额" : "Turnover"}
                className="justify-end"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onToggle={toggleSort}
              />
            </div>

            <div className="terminal-scroll min-h-0 flex-1 overflow-y-auto">
              {rows.length === 0 && (
                <p className="px-3 py-8 text-center text-xs text-muted">
                  {t("common.noData")}
                </p>
              )}
              {rows.map((s) => {
                const tk = tickers[s.symbol];
                if (!tk) return null;
                const active = s.symbol === symbol;
                const up = tk.change24h > 0;
                const down = tk.change24h < 0;
                return (
                  <LocaleLink
                    key={s.symbol}
                    href={`${basePath}/${s.symbol}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "grid grid-cols-[1.2fr_0.9fr_0.8fr_0.9fr] items-center gap-1 px-3 py-2 text-xs transition",
                      active && "bg-[#1a3d2a]/30",
                      !active && up && "hover:bg-[#141414]",
                      !active && down && "hover:bg-[#2a1518]/40",
                      !active && !up && !down && "hover:bg-[#141414]",
                      down && !active && "bg-[#2a1518]/20",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWatch(s.symbol);
                        }}
                        className="shrink-0"
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            watchlist.includes(s.symbol)
                              ? "fill-amber-400 text-amber-400"
                              : "text-[#555]",
                          )}
                        />
                      </button>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                          COIN_COLORS[s.base] ?? "bg-[#3a3a3a]",
                        )}
                      >
                        {s.base.slice(0, 1)}
                      </span>
                      <span className="truncate font-medium">
                        {displayPair(s.symbol)}
                      </span>
                    </span>
                    <span className="text-right font-mono tabular-nums">
                      {formatPrice(tk.last, s.pricePrecision, locale)}
                    </span>
                    <PriceChange
                      value={tk.change24h}
                      className="justify-end text-[11px]"
                    />
                    <span className="text-right font-mono tabular-nums text-[#c8cdd6]">
                      {formatCompact(tk.quoteVolume24h, locale)}
                    </span>
                  </LocaleLink>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 border-t border-[#2a2a2a] px-3 py-1.5 text-[10px] text-up">
              <Wifi className="h-3 w-3" />
              {t("trade.networkStable")}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) updatePos();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-base font-semibold hover:bg-[#141414]"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {displayPair(symbol)}
        <ChevronDown
          className={cn("h-4 w-4 text-muted transition", open && "rotate-180")}
        />
      </button>
      {panel}
    </>
  );
}
