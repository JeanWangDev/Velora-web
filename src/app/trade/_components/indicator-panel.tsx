/**
 * 交易页右侧「指标」抽屉：按分类勾选，通过 TVChartControls 调用 createStudy。
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  getIndicatorById,
  searchIndicators,
  INDICATOR_CATEGORIES,
} from "@/app/trade/_config/indicators";
import type { IndicatorCategoryId } from "@/app/trade/_types/indicators";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { formatIndicatorDisplayLabel } from "@/app/trade/_config/indicator-display";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";

interface IndicatorPanelProps {
  chartControls: TVChartControls | null;
}

export function IndicatorPanel({ chartControls }: IndicatorPanelProps) {
  const t = useTranslation();
  const [activeCategory, setActiveCategory] =
    useState<IndicatorCategoryId>("technical");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isSearching = searchQuery.trim().length > 0;

  const categoryItems = useMemo(
    () =>
      searchIndicators(searchQuery, {
        category: activeCategory,
        allCategories: isSearching,
      }),
    [activeCategory, searchQuery, isSearching],
  );

  const selectableItems = useMemo(
    () => categoryItems.filter((item) => !item.phase2 && item.tvStudyName),
    [categoryItems],
  );

  const allDraftSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => draftIds.includes(item.id));

  useEffect(() => {
    if (!chartControls) {
      return;
    }

    return chartControls.subscribeAppliedIndicators((ids) => {
      setAppliedIds(ids);
      setDraftIds(ids);
    });
  }, [chartControls]);

  const toggleItem = (id: string, checked: boolean) => {
    setDraftIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const toggleSelectAll = () => {
    if (allDraftSelected) {
      setDraftIds((prev) =>
        prev.filter((id) => !selectableItems.some((item) => item.id === id)),
      );
      return;
    }

    setDraftIds((prev) => {
      const next = new Set(prev);
      for (const item of selectableItems) {
        next.add(item.id);
      }
      return Array.from(next);
    });
  };

  const handleCancel = () => {
    setDraftIds(appliedIds);
  };

  const handleApply = async () => {
    if (!chartControls) {
      toast.error(t("trade.indicatorPanel.chartNotReady"));
      return;
    }

    const phase2Selected = draftIds.filter((id) => getIndicatorById(id)?.phase2);

    if (phase2Selected.length > 0) {
      toast.info(t("trade.indicatorPanel.phase2Hint"));
    }

    const draftSet = new Set(draftIds);
    const appliedSet = new Set(appliedIds);
    const toAdd = draftIds.filter((id) => !appliedSet.has(id));
    const toRemove = appliedIds.filter((id) => !draftSet.has(id));

    setSubmitting(true);
    try {
      await chartControls.applyIndicators(toAdd, toRemove);
      const nextApplied = chartControls.getAppliedIndicatorIds();
      setAppliedIds(nextApplied);
      setDraftIds(nextApplied);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("trade.indicatorPanel.applyFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-border px-3 py-2">
        <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
          {INDICATOR_CATEGORIES.map((category) => {
            const active = !isSearching && category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery("");
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 transition ${
                  active
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                } ${isSearching ? "opacity-60" : ""}`}
              >
                {t(`indicators.categories.${category}` as const)}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("trade.indicatorPanel.searchPlaceholder")}
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-8 text-xs text-foreground outline-none transition placeholder:text-muted focus:border-accent/40"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label={t("trade.indicatorPanel.cancel")}
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {selectableItems.length > 0 ? (
          <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-muted">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-border accent-accent"
              checked={allDraftSelected}
              onChange={toggleSelectAll}
            />
            {t("trade.indicatorPanel.selectAll")}
          </label>
        ) : null}

        {categoryItems.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">
            {t("trade.indicatorPanel.searchEmpty")}
          </p>
        ) : (
          <div className="space-y-0.5">
            {categoryItems.map((item) => {
              const checked = draftIds.includes(item.id);
              const disabled = item.phase2 || !item.tvStudyName;
              const isApplied = appliedIds.includes(item.id);

              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-xs transition ${
                    checked
                      ? "bg-accent/5 text-foreground"
                      : "text-foreground hover:bg-surface-muted"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-accent"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => toggleItem(item.id, event.target.checked)}
                  />
                  <span className="leading-5">
                    {isSearching ? (
                      <span className="mr-1 text-[10px] text-muted">
                        {t(`indicators.categories.${item.category}` as const)}
                        {" · "}
                      </span>
                    ) : null}
                    {formatIndicatorDisplayLabel(item)}
                    {item.phase2 ? (
                      <span className="ml-1 text-[10px] text-muted">
                        ({t("trade.indicatorPanel.phase2Badge")})
                      </span>
                    ) : null}
                    {isApplied && !item.phase2 ? (
                      <span className="ml-1 text-[10px] text-accent">
                        · {t("trade.indicatorPanel.onChart")}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-md border border-border px-4 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
        >
          {t("trade.indicatorPanel.cancel")}
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={submitting || !chartControls}
          className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting
            ? t("trade.indicatorPanel.applying")
            : t("trade.indicatorPanel.apply")}
        </button>
      </div>
    </div>
  );
}
