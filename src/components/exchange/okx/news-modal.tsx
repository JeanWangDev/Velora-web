"use client";

import { useEffect, useState } from "react";
import { X, Maximize2 } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { EventsService } from "@/app/news/_services/events-service";
import { AnnouncementService } from "@/services/announcement-service";
import { formatDateTime } from "@/utils/format-exchange";
import { isChineseLocale } from "@/i18n/locale-helpers";

interface NewsItem {
  id: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  ts: number;
}

export function NewsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      EventsService.recent(8),
      AnnouncementService.list("all", 1, 4),
    ])
      .then(([events, anns]) => {
        const fromEvents: NewsItem[] = (events.data ?? []).map((e) => ({
          id: `ev-${e.id}`,
          titleZh: e.title,
          titleEn: e.title,
          summaryZh: e.description ?? "",
          summaryEn: e.description ?? "",
          ts: e.publishedAt ?? Date.now(),
        }));
        const fromAnns: NewsItem[] = (anns.rows ?? []).map((a) => ({
          id: `ann-${a.id}`,
          titleZh: a.titleZh,
          titleEn: a.titleEn,
          summaryZh: a.summaryZh,
          summaryEn: a.summaryEn,
          ts: a.publishedAt,
        }));
        setItems(
          [...fromEvents, ...fromAnns].sort((a, b) => b.ts - a.ts).slice(0, 12),
        );
      })
      .catch(() => setItems([]));
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(80vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--terminal-border)] bg-[var(--terminal-bg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--terminal-border)] px-4 py-3">
          <h2 className="text-base font-semibold">{t("trade.tabNews")}</h2>
          <div className="flex gap-1">
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="terminal-scroll flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t("common.noData")}</p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="border-b border-[var(--terminal-border)] py-4 last:border-0"
              >
                <div className="mb-1 text-[10px] text-muted">
                  <time>{formatDateTime(item.ts, locale)}</time>
                </div>
                <h3 className="text-sm font-medium leading-snug">
                  {isChineseLocale(locale) ? item.titleZh : item.titleEn}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {isChineseLocale(locale) ? item.summaryZh : item.summaryEn}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
