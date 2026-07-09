"use client";

import { getIndicatorById } from "@/app/trade/_config/indicators";
import { formatIndicatorDisplayLabel } from "@/app/trade/_config/indicator-display";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import type { ChartTemplate } from "@/types/chart-template";
import type { TradingPair } from "@/types/trading-pair";
import { formatTemplateTime, resolveTemplateSymbol } from "@/utils/chart-template";
import { Copy, Star } from "lucide-react";

type TemplateCardProps = {
  template: ChartTemplate;
  pairs: TradingPair[];
  mode: "mine" | "public";
  onApply: (template: ChartTemplate) => void;
  onCopy?: (template: ChartTemplate) => void;
  onDelete?: (template: ChartTemplate) => void;
  onRename?: (template: ChartTemplate) => void;
  onSetDefault?: (template: ChartTemplate) => void;
};

export function TemplateCard({
  template,
  pairs,
  mode,
  onApply,
  onCopy,
  onDelete,
  onRename,
  onSetDefault,
}: TemplateCardProps) {
  const t = useTranslation();
  const locale = useLocale();
  const refSymbol = resolveTemplateSymbol(template, pairs) ?? template.symbol;

  const indicatorItems = template.indicatorIds.map((id) => {
    const def = getIndicatorById(id);
    return {
      id,
      label: def ? formatIndicatorDisplayLabel(def) : id,
    };
  });

  return (
    <li className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{template.name}</h2>
              {template.isOfficial ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  {t("templatesPage.officialBadge")}
                </span>
              ) : null}
              {template.isDefault ? (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {t("templatesPage.defaultBadge")}
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  template.visibility === "public"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {template.visibility === "public"
                  ? t("templatesPage.visibilityPublic")
                  : t("templatesPage.visibilityPrivate")}
              </span>
            </div>
            <p className="mt-1 break-all font-mono text-xs text-muted">
              {t("templatesPage.templateId")}: {template.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              {t("templatesPage.refSymbol")}: {refSymbol || t("templatesPage.noRefSymbol")}
              {template.symbolId ? ` (#${template.symbolId})` : ""}
            </span>
            <span>
              {t("templatesPage.updatedAt")} {formatTemplateTime(template.updatedAt, locale)}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">
              {t("templatesPage.indicators")} ({indicatorItems.length})
            </p>
            <ul className="space-y-1 rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground">
              {indicatorItems.map((item) => (
                <li key={item.id} className="flex gap-2 py-0.5">
                  <span className="shrink-0 text-muted">·</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onApply(template)}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            {t("templatesPage.applyOnTrade")}
          </button>
          {mode === "public" && onCopy ? (
            <button
              type="button"
              onClick={() => onCopy(template)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40"
            >
              <Copy className="h-3.5 w-3.5" />
              {t("templatesPage.copyToPrivate")}
            </button>
          ) : null}
          {mode === "mine" && onRename ? (
            <button
              type="button"
              onClick={() => onRename(template)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent/40"
            >
              {t("templatesPage.rename")}
            </button>
          ) : null}
          {mode === "mine" && onSetDefault && template.visibility === "private" ? (
            <button
              type="button"
              title={
                template.isDefault
                  ? t("templatesPage.defaultBadge")
                  : t("templatesPage.setDefault")
              }
              onClick={() => onSetDefault(template)}
              className={`rounded-md border border-border p-1.5 transition hover:border-amber-400/40 ${
                template.isDefault ? "text-amber-500" : "text-muted hover:text-amber-500"
              }`}
            >
              <Star className={`h-4 w-4 ${template.isDefault ? "fill-current" : ""}`} />
            </button>
          ) : null}
          {mode === "mine" && onDelete && !template.isOfficial ? (
            <button
              type="button"
              title={t("templatesPage.delete")}
              onClick={() => onDelete(template)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/5"
            >
              {t("templatesPage.delete")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
