import type { ChartTemplate } from "@/types/chart-template";
import type { TradingPair } from "@/types/trading-pair";

export function resolveTemplateSymbol(
  template: Pick<ChartTemplate, "symbolId" | "symbol">,
  pairs: TradingPair[],
): string | null {
  if (template.symbolId) {
    const pair = pairs.find((p) => p.id === template.symbolId);
    if (pair) return pair.symbol;
  }
  return template.symbol || null;
}

export function findTradingPairBySymbol(
  pairs: TradingPair[],
  symbol: string,
): TradingPair | undefined {
  const normalized = symbol.trim().toUpperCase();
  return pairs.find((p) => p.symbol === normalized);
}

/** 模版是否属于当前交易对（空 symbol 表示不限币对，任意交易对均匹配） */
export function matchesTemplateSymbol(
  template: Pick<ChartTemplate, "symbolId" | "symbol">,
  symbol: string,
  pairs: TradingPair[],
): boolean {
  const normalized = symbol.trim().toUpperCase();
  const ref = (resolveTemplateSymbol(template, pairs) ?? template.symbol ?? "")
    .trim()
    .toUpperCase();
  if (!ref) return true;
  return ref === normalized;
}

export function formatTemplateTime(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

/** 默认模版名：BTCUSDT_20260530_1323 */
export function buildDefaultTemplateName(symbol: string, at = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`;
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}`;
  const base = symbol.trim().toUpperCase();
  return base ? `${base}_${date}_${time}` : `TEMPLATE_${date}_${time}`;
}

/** 复制公开模版时的默认名称 */
export function buildCopyTemplateName(name: string): string {
  const suffix = " (副本)";
  const maxLen = 128;
  const base = name.trim() || "Template";
  if (base.length + suffix.length <= maxLen) {
    return `${base}${suffix}`;
  }
  return `${base.slice(0, maxLen - suffix.length)}${suffix}`;
}

export function sameIndicatorSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

export function sortTemplatesWithDefaultFirst(items: ChartTemplate[]): ChartTemplate[] {
  return [...items].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

/** 设为默认后，仅清除同交易对其它私有模版的默认标记 */
export function markTemplateAsDefault(
  items: ChartTemplate[],
  target: ChartTemplate,
): ChartTemplate[] {
  const symbolKey = target.symbol.trim().toUpperCase();
  return items.map((item) => {
    if (item.id === target.id && item.visibility === "private") {
      return { ...item, isDefault: true };
    }
    const sameSymbol = item.symbol.trim().toUpperCase() === symbolKey;
    if (sameSymbol && item.visibility === "private" && item.isDefault) {
      return { ...item, isDefault: false };
    }
    return item;
  });
}

export function canUpdateTemplate(
  template: ChartTemplate | null,
  owned: boolean,
): boolean {
  if (!template || !owned || template.isOfficial) return false;
  return true;
}
