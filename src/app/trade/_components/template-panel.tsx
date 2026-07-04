"use client";

import type { ChartTemplate } from "@/types/chart-template";
import type { TradingPair } from "@/types/trading-pair";
import {
  markTemplateAsDefault,
  matchesTemplateSymbol,
  resolveTemplateSymbol,
  sortTemplatesWithDefaultFirst,
} from "@/utils/chart-template";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { getIndicatorById } from "@/app/trade/_config/indicators";
import { formatIndicatorDisplayLabel } from "@/app/trade/_config/indicator-display";
import { ChartTemplateService } from "@/services/chart-template-service";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";

type TemplatePanelProps = {
  chartControls: TVChartControls | null;
  pairs: TradingPair[];
  symbol: string;
  isLoggedIn: boolean;
  activeTemplateId?: string | null;
  onApply: (template: ChartTemplate) => void;
  onResetToEmpty: () => void;
  refreshKey?: number;
};

export function TemplatePanel({
  chartControls,
  pairs,
  symbol,
  isLoggedIn,
  activeTemplateId = null,
  onApply,
  onResetToEmpty,
  refreshKey = 0,
}: TemplatePanelProps) {
  const t = useTranslation();
  const [items, setItems] = useState<ChartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ChartTemplate | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const filterBySymbol = (rows: ChartTemplate[]) =>
          rows.filter((item) => matchesTemplateSymbol(item, symbol, pairs));

        if (isLoggedIn) {
          const res = await ChartTemplateService.listMine({ symbol });
          if (!cancelled) {
            setItems(sortTemplatesWithDefaultFirst(filterBySymbol(res.data)));
          }
        } else {
          const res = await ChartTemplateService.listPublic({ symbol });
          if (!cancelled) {
            setItems(filterBySymbol(res.data).filter((item) => item.isOfficial));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          if (isLoggedIn) {
            toast.error(
              error instanceof Error ? error.message : t("trade.templates.loadFailed"),
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, pairs, refreshKey, symbol, t]);

  const handleApply = (template: ChartTemplate) => {
    if (!chartControls) {
      toast.error(t("trade.indicatorPanel.chartNotReady"));
      return;
    }
    onApply(template);
  };

  const handleDelete = (template: ChartTemplate) => {
    setDeleteTarget(template);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteSubmitting(true);
    try {
      await ChartTemplateService.remove(deleteTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(t("trade.templates.deleted"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("trade.templates.deleteFailed"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSetDefault = async (template: ChartTemplate) => {
    if (template.isDefault) {
      toast.info(t("trade.templates.alreadyDefault"));
      return;
    }

    try {
      const updated = await ChartTemplateService.setDefault(template.id);
      setItems((prev) => sortTemplatesWithDefaultFirst(markTemplateAsDefault(prev, updated)));
      toast.success(t("trade.templates.defaultSet"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("trade.templates.defaultSetFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isEmptyActive = activeTemplateId === null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-2">
        <p className="text-[11px] text-muted">
          {t("trade.templates.symbolFilterHint").replace("{symbol}", symbol)}
        </p>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {isLoggedIn ? (
          <li className={`px-4 py-3 ${isEmptyActive ? "bg-accent/5" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {t("trade.templates.emptyTemplate")}
                {isEmptyActive ? (
                  <span className="ml-1.5 text-[10px] font-normal text-accent">
                    ({t("trade.templates.active")})
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted">{t("trade.templates.emptyTemplateHint")}</p>
            </div>
            {!isEmptyActive ? (
              <button
                type="button"
                onClick={onResetToEmpty}
                className="mt-2 w-full rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                {t("trade.templates.useEmptyTemplate")}
              </button>
            ) : null}
          </li>
        ) : (
          <li className="px-4 py-2">
            <p className="text-xs font-medium text-muted">{t("trade.templates.officialSection")}</p>
            <p className="mt-0.5 text-[11px] text-muted">{t("trade.templates.emptyHintGuest")}</p>
          </li>
        )}

        {items.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted">
            <p>{t("trade.templates.empty")}</p>
            <p className="mt-1 text-xs">
              {isLoggedIn ? t("trade.templates.emptyHint") : t("trade.templates.emptyHintGuest")}
            </p>
          </li>
        ) : null}

        {items.map((template) => {
          const isActive = activeTemplateId === template.id;
          const isDefault = template.isDefault && template.visibility === "private";

          return (
            <li
              key={template.id}
              className={`px-4 py-3 ${isActive ? "bg-accent/5" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {template.name}
                    {isActive ? (
                      <span className="ml-1.5 text-[10px] font-normal text-accent">
                        ({t("trade.templates.active")})
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {template.isOfficial ? (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                        {t("trade.templates.officialBadge")}
                      </span>
                    ) : null}
                    {isDefault ? (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                        {t("trade.templates.defaultBadge")}
                      </span>
                    ) : null}
                    {isLoggedIn ? (
                      <span className="text-[10px] text-muted">
                        {template.visibility === "public"
                          ? t("trade.templates.visibilityPublic")
                          : t("trade.templates.visibilityPrivate")}
                      </span>
                    ) : null}
                  </div>
                  {resolveTemplateSymbol(template, pairs) || template.symbol ? (
                    <p className="mt-0.5 text-xs text-muted">
                      {t("trade.templates.refSymbol")}:{" "}
                      {resolveTemplateSymbol(template, pairs) || template.symbol}
                    </p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {template.indicatorIds
                      .map((id) => {
                        const def = getIndicatorById(id);
                        return def ? formatIndicatorDisplayLabel(def) : id;
                      })
                      .join(" · ")}
                  </p>
                </div>
                {isLoggedIn ? (
                  <div className="flex shrink-0 flex-col gap-1">
                    {template.visibility === "private" ? (
                      <button
                        type="button"
                        title={
                          isDefault
                            ? t("trade.templates.defaultBadge")
                            : t("trade.templates.setDefault")
                        }
                        onClick={() => void handleSetDefault(template)}
                        className={`rounded p-1.5 transition hover:bg-surface-muted ${
                          isDefault
                            ? "text-amber-500 hover:text-amber-500"
                            : "text-muted hover:text-amber-500"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${isDefault ? "fill-current" : ""}`}
                        />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      title={t("trade.templates.delete")}
                      onClick={() => handleDelete(template)}
                      className="rounded p-1.5 text-muted hover:bg-surface-muted hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleApply(template)}
                className="mt-2 w-full rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                {t("trade.templates.apply")}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 border-t border-border px-4 py-2">
        <Link
          href="/templates"
          className="block text-center text-xs font-medium text-accent hover:underline"
        >
          {t("trade.templates.viewRankings")}
        </Link>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t("trade.templates.deleteTitle")}
        message={t("trade.templates.deleteConfirm")}
        confirmLabel={t("trade.templates.delete")}
        cancelLabel={t("trade.indicatorPanel.cancel")}
        onConfirm={confirmDelete}
        danger
        submitting={deleteSubmitting}
      />
    </div>
  );
}
