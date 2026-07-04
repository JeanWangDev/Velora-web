import type { Locale } from "@/i18n/dictionaries";

/** URL 语言标识，对齐专业交易所（如 /zh-CN/trade/BTC-USDT） */
export const URL_LOCALES = ["zh-CN", "en"] as const;
export type UrlLocale = (typeof URL_LOCALES)[number];

export const DEFAULT_URL_LOCALE: UrlLocale = "zh-CN";

export function isUrlLocale(value: string): value is UrlLocale {
  return (URL_LOCALES as readonly string[]).includes(value);
}

export function urlLocaleToDict(locale: UrlLocale): Locale {
  return locale === "en" ? "en" : "zh";
}

export function dictToUrlLocale(locale: Locale): UrlLocale {
  return locale === "en" ? "en" : "zh-CN";
}

/** 从 pathname 解析语言前缀，如 /zh-CN/trade/BTC-USDT → zh-CN */
export function getUrlLocaleFromPath(pathname: string): UrlLocale | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && isUrlLocale(seg) ? seg : null;
}

/** 去掉语言前缀：/zh-CN/trade/BTC-USDT → /trade/BTC-USDT */
export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (isUrlLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/** 给路径加上语言前缀 */
export function withLocalePath(pathname: string, locale: UrlLocale): string {
  const bare = stripLocaleFromPath(pathname);
  if (bare === "/") return `/${locale}`;
  return `/${locale}${bare}`;
}
