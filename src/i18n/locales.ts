import type { Locale } from "@/i18n/dictionaries";

/**
 * URL 语言标识（如 /zh-CN/trade/BTC-USDT）。
 * UI 文案目前完整支持 zh / en，其余语言先回退到 en。
 */
export const URL_LOCALES = [
  "zh-CN",
  "zh-TW",
  "en",
  "vi",
  "ru",
  "es",
  "id",
  "fr",
  "ko",
  "ja",
  "pt",
  "de",
  "it",
  "tr",
  "uk",
  "ar",
  "th",
  "pl",
] as const;

export type UrlLocale = (typeof URL_LOCALES)[number];

export const DEFAULT_URL_LOCALE: UrlLocale = "zh-CN";

/** 语言展示名（切换器用） */
export const URL_LOCALE_LABELS: Record<UrlLocale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  vi: "Tiếng Việt",
  ru: "Русский",
  es: "Español",
  id: "Bahasa Indonesia",
  fr: "Français",
  ko: "한국어",
  ja: "日本語",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  tr: "Türkçe",
  uk: "Українська",
  ar: "العربية",
  th: "ไทย",
  pl: "Polski",
};

export function isUrlLocale(value: string): value is UrlLocale {
  return (URL_LOCALES as readonly string[]).includes(value);
}

/** URL 语言 → 字典语言（仅 zh / en 有完整文案） */
export function urlLocaleToDict(locale: UrlLocale): Locale {
  return locale === "zh-CN" || locale === "zh-TW" ? "zh" : "en";
}

export function dictToUrlLocale(locale: Locale): UrlLocale {
  return locale === "en" ? "en" : "zh-CN";
}

export function getUrlLocaleFromPath(pathname: string): UrlLocale | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && isUrlLocale(seg) ? seg : null;
}

export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (isUrlLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function withLocalePath(pathname: string, locale: UrlLocale): string {
  const bare = stripLocaleFromPath(pathname);
  if (bare === "/") return `/${locale}`;
  return `/${locale}${bare}`;
}
