"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getUrlLocaleFromPath,
  isUrlLocale,
  urlLocaleToDict,
  type UrlLocale,
} from "@/i18n/locales";
import { useLocaleStore } from "@/i18n/locale-store";

function readLocaleCookie(): UrlLocale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)velora-url-locale=([^;]+)/);
  const value = match?.[1];
  return value && isUrlLocale(value) ? value : null;
}

/** 将 URL 语言前缀同步到字典 store */
export function LocaleSync() {
  const pathname = usePathname();
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    const urlLocale = getUrlLocaleFromPath(pathname) ?? readLocaleCookie();
    if (!urlLocale) return;
    setLocale(urlLocaleToDict(urlLocale));
  }, [pathname, setLocale]);

  return null;
}
