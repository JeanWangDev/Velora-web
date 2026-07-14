"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { getSpotSymbols } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import {
  displayPair,
  formatCompact,
  formatPrice,
} from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";

export default function MarketsPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "watch">("all");
  const tickers = useMarketStore((s) => s.tickers);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const toggle = useWatchlistStore((s) => s.toggle);

  const rows = useMemo(() => {
    return getSpotSymbols().filter((s) => {
      if (tab === "watch" && !watchlist.includes(s.symbol)) return false;
      if (!q) return true;
      const qq = q.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(qq) ||
        s.base.toLowerCase().includes(qq) ||
        s.displayName.toLowerCase().includes(qq)
      );
    });
  }, [q, tab, watchlist]);

  return (
    <div className="aurora-bg mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("markets.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("trade.focusDeck")}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("markets.search")}
            className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(["all", "watch"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === k
                ? "bg-primary/15 text-primary"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            {k === "all" ? t("markets.all") : t("markets.watchlist")}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("markets.pair")}</th>
              <th className="px-4 py-3 text-right">{t("markets.price")}</th>
              <th className="px-4 py-3 text-right">{t("markets.change")}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">
                {t("markets.volume")}
              </th>
              <th className="px-4 py-3 text-right">{t("markets.action")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const tk = tickers[s.symbol];
              const meta = getSymbolMeta(s.symbol);
              return (
                <tr
                  key={s.symbol}
                  className="border-t border-border/60 transition hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(s.symbol)}
                        className="text-muted hover:text-accent"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            watchlist.includes(s.symbol)
                              ? "fill-accent text-accent"
                              : ""
                          }`}
                        />
                      </button>
                      <div>
                        <p className="font-medium">{displayPair(s.symbol)}</p>
                        <p className="text-xs text-muted">{s.displayName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {tk
                      ? formatPrice(tk.last, meta?.pricePrecision ?? 2, locale)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PriceChange value={tk?.change24h ?? 0} />
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-muted sm:table-cell">
                    {tk ? formatCompact(tk.quoteVolume24h, locale) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/trade/${s.symbol}`}
                      className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/25"
                    >
                      {t("markets.action")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
