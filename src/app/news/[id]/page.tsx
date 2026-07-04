"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, ExternalLink, Loader2 } from "lucide-react";
import { baseToTradingPair } from "@/utils/symbol";
import {
  cleanEventTitle,
  formatRelativeTime,
  formatSourceLabel,
} from "@/app/news/_utils/event-display";
import { EventsService } from "@/app/news/_services/events-service";
import { useLocale } from "@/i18n/use-translation";
import type { EventDetail } from "@/app/news/_types/event";
import { useTranslation } from "@/i18n/use-translation";

export default function NewsDetailPage() {
  const t = useTranslation();
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await EventsService.getById(id);
        setEvent(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("news.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("news.backToFeed")}
      </Link>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-400 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      {event ? (
        <article className="space-y-6">
          <header className="space-y-3">
            <p className="text-sm text-muted">
              {formatSourceLabel(event.source)} · {formatRelativeTime(event.publishedAt, locale)}
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {cleanEventTitle(event.title)}
            </h1>
          </header>

          {event.cover ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.cover} alt="" className="max-h-80 w-full object-cover" />
            </div>
          ) : null}

          {event.description ? (
            <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4">
            {event.primarySymbol || event.symbols[0] ? (
              <Link
                href={`/trade?symbol=${baseToTradingPair(event.primarySymbol || event.symbols[0])}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <BarChart3 className="h-4 w-4" />
                {t("news.viewOnChart")}
              </Link>
            ) : null}
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent hover:underline"
              >
                {t("news.readOriginal")}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
