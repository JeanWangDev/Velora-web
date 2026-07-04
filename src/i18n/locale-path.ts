"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  dictToUrlLocale,
  getUrlLocaleFromPath,
  stripLocaleFromPath,
  withLocalePath,
  type UrlLocale,
} from "@/i18n/locales";
import { useLocale, useSetLocale } from "@/i18n/use-translation";
import type { Locale } from "@/i18n/dictionaries";

function readLocaleCookie(): UrlLocale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)velora-url-locale=([^;]+)/);
  const value = match?.[1];
  return value && (value === "zh-CN" || value === "en") ? value : null;
}

/** 当前 URL 语言标识 */
export function useUrlLocale(): UrlLocale {
  const pathname = usePathname();
  const dictLocale = useLocale();
  return (
    getUrlLocaleFromPath(pathname) ??
    readLocaleCookie() ??
    dictToUrlLocale(dictLocale)
  );
}

/** 生成带语言前缀的路径 */
export function useLocaleHref() {
  const urlLocale = useUrlLocale();
  return useCallback(
    (href: string) => withLocalePath(href, urlLocale),
    [urlLocale],
  );
}

/** 切换语言：改 URL 前缀并同步字典 */
export function useSwitchLocale() {
  const pathname = usePathname();
  const router = useRouter();
  const setLocale = useSetLocale();

  return useCallback(
    (next: Locale) => {
      const urlLocale = dictToUrlLocale(next);
      const bare = stripLocaleFromPath(pathname);
      setLocale(next);
      router.push(withLocalePath(bare, urlLocale));
    },
    [pathname, router, setLocale],
  );
}
