"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { EventCard } from "@/app/news/_components/event-card";
import { useEventsWs } from "@/app/news/_hooks/use-events-ws";
import { EventsService } from "@/app/news/_services/events-service";
import { groupEventsByDay } from "@/app/news/_utils/event-display";
import type { EventListItem } from "@/app/news/_types/event";
import { TradingPairsService } from "@/services/trading-pairs-service";
import type { TradingPair } from "@/types/trading-pair";
import { baseFromTradingPair, baseToTradingPair } from "@/utils/symbol";
import { useTranslation } from "@/i18n/use-translation";

const FALLBACK_PAIRS: TradingPair[] = [
  {
    id: 1,
    baseAsset: "BTC",
    symbol: "BTCUSDT",
    exchange: "binance",
    displayName: "Bitcoin",
    sortOrder: 10,
    isDefault: true,
    accessTier: 0,
    status: 1,
  },
  {
    id: 2,
    baseAsset: "ETH",
    symbol: "ETHUSDT",
    exchange: "binance",
    displayName: "Ethereum",
    sortOrder: 20,
    isDefault: false,
    accessTier: 0,
    status: 1,
  },
  {
    id: 3,
    baseAsset: "SOL",
    symbol: "SOLUSDT",
    exchange: "binance",
    displayName: "Solana",
    sortOrder: 30,
    isDefault: false,
    accessTier: 0,
    status: 1,
  },
];

export function NewsPageClient() {
  const t = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<EventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pairs, setPairs] = useState<TradingPair[]>(FALLBACK_PAIRS);
  const pageSize = 30;

  const symbolFilter = searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const baseFilter = symbolFilter ? baseFromTradingPair(symbolFilter) : "";

  useEffect(() => {
    void TradingPairsService.list()
      .then((list) => {
        if (list.length > 0) setPairs(list);
      })
      .catch(() => {
        // fallback
      });
  }, []);

  const setSymbolFilter = useCallback(
    (base: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!base) {
        params.delete("symbol");
      } else {
        params.set("symbol", baseToTradingPair(base));
      }
      const qs = params.toString();
      router.replace(qs ? `/news?${qs}` : "/news");
    },
    [router, searchParams],
  );

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError(null);

      try {
        const res = await EventsService.list({
          page: nextPage,
          pageSize,
          symbol: baseFilter || undefined,
        });

        setItems(res.data);
        setTotal(res.total);
        setPage(res.page);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("news.loadFailed"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [t, baseFilter],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useEventsWs(
    useCallback(
      (event: EventListItem) => {
        if (baseFilter) {
          const primary = event.primarySymbol || event.symbols[0] || "";
          if (primary !== baseFilter) return;
        }
        setItems((prev) => {
          if (prev.some((p) => p.id === event.id)) return prev;
          return [event, ...prev].slice(0, pageSize);
        });
        setTotal((n) => n + 1);
      },
      [baseFilter],
    ),
  );

  const groups = useMemo(
    () => groupEventsByDay(items, { today: t("news.today"), yesterday: t("news.yesterday") }),
    [items, t],
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("news.title")}
        </h1>
        <p className="text-sm text-muted">{t("news.description")}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSymbolFilter("")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            !baseFilter
              ? "bg-foreground text-background"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          {t("news.filterAll")}
        </button>
        {pairs.map((pair) => (
          <button
            key={pair.symbol}
            type="button"
            onClick={() => setSymbolFilter(pair.baseAsset)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              baseFilter === pair.baseAsset
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {pair.baseAsset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load(page)}
          disabled={loading}
          className="ml-auto rounded-md border border-border p-2 text-muted hover:text-foreground disabled:opacity-50"
          aria-label={t("news.refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {baseFilter ? (
        <p className="text-xs text-muted">
          <Link
            href={`/trade?symbol=${baseToTradingPair(baseFilter)}`}
            className="font-medium text-accent hover:underline"
          >
            {t("news.viewOnChart")} ({baseToTradingPair(baseFilter)})
          </Link>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-400/50 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : null}

      {!loading && items.length === 0 && !error ? (
        <div className="py-16 text-center text-sm text-muted">
          {baseFilter ? t("news.emptyFiltered") : t("news.emptyRunIngest")}
        </div>
      ) : null}

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.label} className="space-y-1">
            <h2 className="sticky top-0 z-10 bg-background/90 py-2 text-xs font-semibold uppercase tracking-wider text-muted backdrop-blur">
              {group.label}
            </h2>
            <div className="divide-y divide-border/60">
              {group.items.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </section>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4 border-t border-border pt-4 text-sm text-muted">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1)}
            className="disabled:opacity-40"
          >
            {t("news.prev")}
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1)}
            className="disabled:opacity-40"
          >
            {t("news.next")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
