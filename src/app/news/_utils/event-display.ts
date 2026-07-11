import type { EventListItem } from "@/app/news/_types/event";
import { isChineseLocale } from "@/i18n/locale-helpers";

const SOURCE_LABELS: Record<string, string> = {
  rss_coindesk: "CoinDesk",
  rss_odaily: "Odaily",
  binance_liquidation: "Binance",
};

export function cleanEventTitle(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*(CoinDesk|Decrypt|CoinTelegraph|Odaily|Google News|PANews).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatSourceLabel(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  if (source.startsWith("rss_")) {
    const key = source.replace("rss_", "");
    return key.charAt(0).toUpperCase() + key.replace(/_/g, " ").slice(1);
  }
  return source;
}

export function formatRelativeTime(ms: number, locale: string): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  const rtf = new Intl.RelativeTimeFormat(isChineseLocale(locale) ? "zh-Hans" : "en", {
    numeric: "auto",
  });

  if (day > 0) return rtf.format(-day, "day");
  if (hour > 0) return rtf.format(-hour, "hour");
  if (min > 0) return rtf.format(-min, "minute");
  return rtf.format(-Math.max(1, sec), "second");
}

export function formatEventType(type: string, locale: string): string {
  const zh = isChineseLocale(locale);
  const map: Record<string, string> = {
    news: zh ? "资讯" : "News",
    liquidation: zh ? "爆仓" : "Liquidation",
  };
  return map[type] ?? type;
}

export function formatSentiment(
  sentiment: string,
  locale: string,
): { label: string; className: string } {
  const zh = isChineseLocale(locale);
  if (sentiment === "bullish") {
    return {
      label: zh ? "偏多" : "Bullish",
      className: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (sentiment === "bearish") {
    return {
      label: zh ? "偏空" : "Bearish",
      className: "text-rose-600 dark:text-rose-400",
    };
  }
  return { label: zh ? "中性" : "Neutral", className: "text-muted" };
}

export function isSignalEvent(event: EventListItem): boolean {
  return event.type === "liquidation";
}

export function groupEventsByDay(
  events: EventListItem[],
  labels: { today: string; yesterday: string },
): Array<{ label: string; items: EventListItem[] }> {
  const buckets = new Map<string, EventListItem[]>();

  for (const event of events) {
    const d = new Date(event.publishedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = buckets.get(key) ?? [];
    list.push(event);
    buckets.set(key, list);
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  return Array.from(buckets.entries()).map(([key, items]) => {
    let label = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(items[0].publishedAt),
    );
    if (key === todayKey) label = labels.today;
    else if (key === yesterdayKey) label = labels.yesterday;

    return { label, items };
  });
}
