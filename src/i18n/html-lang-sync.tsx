"use client";

import { useEffect } from "react";
import { useLocale } from "./use-translation";

/**
 * Keeps `document.documentElement.lang` in sync with the active locale.
 * Mounted once in RootLayout — has no visible output.
 */
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return null;
}
