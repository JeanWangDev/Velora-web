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

/** TradingView / Didit 等第三方组件语言码 */
export function getThirdPartyLocale(locale: Locale | string): string {
  if (locale === "zh-CN" || locale === "zh-TW" || locale === "zh") return "zh";
  return "en";
}

export function localeToHtmlLang(locale: Locale | string): string {
  if (locale === "zh-TW") return "zh-TW";
  if (isChineseLocale(locale)) return "zh-CN";
  return String(locale);
}
