import type { UrlLocale } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

/** 简体 / 繁体中文 */
export function isChineseLocale(locale: Locale | string): boolean {
  return locale === "zh-CN" || locale === "zh-TW" || locale === "zh";
}

/** 使用英文公告 / 英文 UI 兜底文案 */
export function isEnglishContentLocale(locale: Locale | string): boolean {
  return !isChineseLocale(locale);
}

/** Intl 数字 / 日期格式化 */
export function getIntlLocale(locale: Locale | string): string {
  const map: Record<string, string> = {
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    en: "en-US",
    vi: "vi-VN",
    ru: "ru-RU",
    es: "es-ES",
    id: "id-ID",
    fr: "fr-FR",
    ko: "ko-KR",
    ja: "ja-JP",
    pt: "pt-BR",
    de: "de-DE",
    it: "it-IT",
    tr: "tr-TR",
    uk: "uk-UA",
    ar: "ar-SA",
    th: "th-TH",
    pl: "pl-PL",
  };
  return map[locale] ?? "en-US";
}

/** TradingView Charting Library 语言码（见 public/charting_library/.../static/*-tv-chart*.html） */
const TRADING_VIEW_LOCALE_MAP: Record<string, string> = {
  "zh-CN": "zh",
  "zh-TW": "zh_TW",
  zh: "zh",
  en: "en",
  vi: "vi",
  ru: "ru",
  es: "es",
  id: "id_ID",
  fr: "fr",
  ko: "ko",
  ja: "ja",
  pt: "pt",
  de: "de",
  it: "it",
  tr: "tr",
  uk: "en",
  ar: "ar",
  th: "th",
  pl: "pl",
};

/** TradingView / 图表组件语言码 */
export function getThirdPartyLocale(locale: Locale | string): string {
  return TRADING_VIEW_LOCALE_MAP[locale] ?? "en";
}

/** Didit KYC 等业务方语言码（BCP 47 简写） */
export function getDiditLocale(locale: Locale | string): string {
  if (locale === "zh-TW") return "zh-TW";
  if (locale === "zh-CN" || locale === "zh") return "zh-CN";
  return String(locale);
}

export function localeToHtmlLang(locale: Locale | string): string {
  if (locale === "zh-TW") return "zh-TW";
  if (isChineseLocale(locale)) return "zh-CN";
  return String(locale);
}
