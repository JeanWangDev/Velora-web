"use client";

import { useCallback } from "react";
import { dictionaries, type Dictionary, type Locale } from "./dictionaries";
import { useLocaleStore } from "./locale-store";

// ─── Type-safe dotted key paths ──────────────────────────────────────────────
// "site.title" | "nav.home" | "chart.title" | ...

type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPath<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

export type TranslationKey = DotPath<Dictionary>;

// ─── Lookup helper ───────────────────────────────────────────────────────────

function lookup(dict: Dictionary, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return key; // Fall back to the key itself if not found
    }
  }
  return typeof cur === "string" ? cur : key;
}

// ─── Public hooks ────────────────────────────────────────────────────────────

/** Returns the current active locale (e.g. "zh", "en"). */
export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}

/**
 * Returns the entire dictionary for the current locale.
 * Use this when you need to render arrays or nested objects that
 * can't be expressed as a single dot-path string.
 */
export function useDict(): Dictionary {
  const locale = useLocale();
  return dictionaries[locale];
}

/** Returns a setter to change the active locale, persisted to localStorage. */
export function useSetLocale() {
  return useLocaleStore((s) => s.setLocale);
}

/**
 * Returns a `t(key)` function that resolves a dot-separated key against
 * the current locale's dictionary.
 *
 * @example
 *   const t = useTranslation();
 *   <h1>{t("chart.title")}</h1>
 */
export function useTranslation() {
  const locale = useLocale();
  const dict = dictionaries[locale];

  return useCallback(
    (key: TranslationKey): string => lookup(dict, key),
    [dict],
  );
}
