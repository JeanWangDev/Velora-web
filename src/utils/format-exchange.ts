import type { Locale } from "@/i18n/types";
import { getIntlLocale } from "@/i18n/locale-helpers";

export function formatPrice(
  value: number,
  precision: number,
  locale: Locale = "zh-CN",
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: Math.min(2, precision),
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatCompact(value: number, locale: Locale = "zh-CN"): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatQty(value: number, precision: number): string {
  return value.toFixed(precision);
}

export function formatTime(ts: number, locale: Locale = "zh-CN"): string {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);
}

export function formatDateTime(ts: number, locale: Locale = "zh-CN"): string {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}

export function displayPair(symbol: string): string {
  return symbol.replace("-", "/");
}
