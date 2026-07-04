import type { Locale } from "@/i18n/dictionaries";

export function formatPrice(
  value: number,
  precision: number,
  locale: Locale = "zh",
): string {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    minimumFractionDigits: Math.min(2, precision),
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatCompact(value: number, locale: Locale = "zh"): string {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale = "zh"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatQty(value: number, precision: number): string {
  return value.toFixed(precision);
}

export function formatTime(ts: number, locale: Locale = "zh"): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);
}

export function formatDateTime(ts: number, locale: Locale = "zh"): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
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
