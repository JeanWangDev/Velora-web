import type { UrlLocale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/types";
import { en } from "@/i18n/messages/en";
import { zhCN } from "@/i18n/messages/zh-CN";
import { zhTW } from "@/i18n/messages/zh-TW";
import { vi } from "@/i18n/messages/vi";
import { ru } from "@/i18n/messages/ru";
import { es } from "@/i18n/messages/es";
import { id } from "@/i18n/messages/id";
import { fr } from "@/i18n/messages/fr";
import { ko } from "@/i18n/messages/ko";
import { ja } from "@/i18n/messages/ja";
import { pt } from "@/i18n/messages/pt";
import { de } from "@/i18n/messages/de";
import { it } from "@/i18n/messages/it";
import { tr } from "@/i18n/messages/tr";
import { uk } from "@/i18n/messages/uk";
import { ar } from "@/i18n/messages/ar";
import { th } from "@/i18n/messages/th";
import { pl } from "@/i18n/messages/pl";

export const dictionaries: Record<UrlLocale, Dictionary> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
  vi,
  ru,
  es,
  id,
  fr,
  ko,
  ja,
  pt,
  de,
  it,
  tr,
  uk,
  ar,
  th,
  pl,
};
