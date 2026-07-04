import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { baseToTradingPair } from "@/utils/symbol";
import {
  cleanEventTitle,
  formatEventType,
  formatRelativeTime,
  formatSentiment,
  formatSourceLabel,
  isSignalEvent,
} from "@/app/news/_utils/event-display";
import type { EventListItem } from "@/app/news/_types/event";
import { useLocale, useTranslation } from "@/i18n/use-translation";

type EventCardProps = {
  event: EventListItem;
  /** 时间线模式：左侧竖线 + 更紧凑 */
  variant?: "feed" | "compact";
};

export function EventCard({ event, variant = "feed" }: EventCardProps) {
  const t = useTranslation();
  const locale = useLocale();
  const title = cleanEventTitle(event.title);
  const summary = event.description.slice(0, 160);
  const source = formatSourceLabel(event.source);
  const { label: sentimentLabel, className: sentimentClass } = formatSentiment(
    event.sentiment,
    locale,
  );
  const signal = isSignalEvent(event);
  const typeLabel = formatEventType(event.type, locale);

  const accent =
    event.sentiment === "bullish"
      ? "border-l-emerald-500"
      : event.sentiment === "bearish"
        ? "border-l-rose-500"
        : signal
          ? "border-l-amber-500"
          : "border-l-border";

  if (variant === "compact") {
    return (
      <article
        className={`border-l-2 ${accent} py-2 pl-3 transition hover:bg-surface-muted/40`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">
              <span className="font-medium text-foreground">{source}</span>
              <span className="mx-1.5">·</span>
              <span>{formatRelativeTime(event.publishedAt, locale)}</span>
            </p>
            <h2 className="mt-1 text-sm font-medium leading-snug text-foreground">
              <Link href={`/news/${event.id}`} className="hover:text-accent hover:underline">
                {title}
              </Link>
            </h2>
            {event.primarySymbol || event.symbols[0] ? (
              <Link
                href={`/trade?symbol=${baseToTradingPair(event.primarySymbol || event.symbols[0])}`}
                className="mt-1 inline-block text-[11px] font-medium text-accent hover:underline"
              >
                {event.primarySymbol || event.symbols[0]}
              </Link>
            ) : null}
          </div>
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted hover:text-accent"
              title={t("news.readOriginal")}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group flex gap-4 border-l-[3px] ${accent} rounded-r-xl bg-surface/80 py-3 pl-4 pr-3 transition hover:bg-surface-muted/50`}
    >
      {event.cover ? (
        <div className="hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-foreground">{source}</span>
          <span className="text-muted">·</span>
          <time className="text-muted" dateTime={new Date(event.publishedAt).toISOString()}>
            {formatRelativeTime(event.publishedAt, locale)}
          </time>
          {signal ? (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              {typeLabel}
            </span>
          ) : null}
          {!signal && event.sentiment !== "neutral" ? (
            <span className={`font-medium ${sentimentClass}`}>{sentimentLabel}</span>
          ) : null}
        </div>

        <h2 className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          <Link href={`/news/${event.id}`} className="hover:text-accent">
            {title}
          </Link>
        </h2>

        {summary ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{summary}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(event.primarySymbol ? [event.primarySymbol] : event.symbols.slice(0, 1)).map((sym) => (
            <Link
              key={sym}
              href={`/trade?symbol=${baseToTradingPair(sym)}`}
              className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[11px] font-medium text-accent hover:underline"
            >
              {sym}
            </Link>
          ))}
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              {t("news.readOriginal")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
