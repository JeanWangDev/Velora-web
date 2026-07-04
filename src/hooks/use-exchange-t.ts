"use client";

import { useTranslation, type TranslationKey } from "@/i18n/use-translation";

export function useExchangeT() {
  const t = useTranslation();
  return (key: string) => t(`exchange.${key}` as TranslationKey);
}
