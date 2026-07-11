"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/use-translation";
import { localeToHtmlLang } from "@/i18n/locale-helpers";

/** 同步 document.documentElement.lang 与当前字典语言 */
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  return null;
}
