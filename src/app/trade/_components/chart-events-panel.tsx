"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { EventsService } from "@/app/news/_services/events-service";
import { cleanEventTitle, formatRelativeTime } from "@/app/news/_utils/event-display";
import type { EventListItem } from "@/app/news/_types/event";
import { baseFromTradingPair } from "@/utils/symbol";
import { useLocale, useTranslation } from "@/i18n/use-translation";

type ChartEventsPanelProps = {
  tradingPair: string;
};

export function ChartEventsPanel({ tradingPair }: ChartEventsPanelProps) {
  const t = useTranslation();
  const locale = useLocale();
  const [items, setItems] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = baseFromTradingPair(tradingPair);
    const to = Date.now();
    const from = to - 7 * 86_400_000;

    void (async () => {
      setLoading(true);
      try {
        const res = await EventsService.chart({ symbol: base, from, to, limit: 20 });
        if (!cancelled) {
          setItems(res.data);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tradingPair]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="border-b border-border px-4 py-2 text-[11px] text-muted">{tradingPair}</p>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex justify-center py-6 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted">{t("trade.chartEvents.empty")}</p>
        ) : null}
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/news/${ev.id}`}
                className="block rounded-md px-2 py-1.5 text-xs hover:bg-surface-muted"
              >
                <span className="text-[10px] text-muted">
                  {formatRelativeTime(ev.publishedAt, locale)}
                </span>
                <p className="mt-0.5 line-clamp-2 font-medium leading-snug text-foreground">
                  {cleanEventTitle(ev.title)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
