"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import {
  CHART_QUICK_INDICATORS,
  MAX_SUB_INDICATORS,
  type QuickIndicatorItem,
} from "@/app/trade/_config/chart-quick-indicators";
import { getIndicatorById } from "@/app/trade/_config/indicators";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { IndicatorSettingsModal } from "@/components/exchange/okx/indicator-settings-modal";
import { useLocale } from "@/i18n/use-translation";
import { isChineseLocale } from "@/i18n/locale-helpers";
import type { Locale } from "@/i18n/types";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

export function ChartIndicatorBar({
  chartControls,
}: {
  chartControls: TVChartControls | null;
}) {
  const locale = useLocale();
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!chartControls) {
      setAppliedIds([]);
      return;
    }
    setAppliedIds(chartControls.getAppliedIndicatorIds());
    return chartControls.subscribeAppliedIndicators(setAppliedIds);
  }, [chartControls]);

  const appliedSet = useMemo(() => new Set(appliedIds), [appliedIds]);

  const subCount = useMemo(() => {
    return CHART_QUICK_INDICATORS.filter(
      (item) =>
        item.kind === "sub" &&
        item.indicatorId &&
        appliedSet.has(item.indicatorId),
    ).length;
  }, [appliedSet]);

  const toggle = useCallback(
    async (item: QuickIndicatorItem) => {
      if (!item.indicatorId || item.disabled) return;
      if (!chartControls) {
        toast.info(isChineseLocale(locale) ? "图表加载中…" : "Chart loading…");
        return;
      }

      const id = item.indicatorId;
      const isOn = appliedSet.has(id);

      if (!isOn && item.kind === "sub") {
        const activeSubs = CHART_QUICK_INDICATORS.filter(
          (q) =>
            q.kind === "sub" &&
            q.indicatorId &&
            appliedSet.has(q.indicatorId),
        );
        if (activeSubs.length >= MAX_SUB_INDICATORS) {
          toast.info(
            isChineseLocale(locale)
              ? `副指标最多 ${MAX_SUB_INDICATORS} 个`
              : `Max ${MAX_SUB_INDICATORS} sub-indicators`,
          );
          return;
        }
      }

      setPending(item.key);
      try {
        if (isOn) {
          await chartControls.applyIndicators([], [id]);
        } else {
          await chartControls.applyIndicators([id], []);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : isChineseLocale(locale)
              ? "指标切换失败"
              : "Failed to toggle indicator",
        );
      } finally {
        setPending(null);
      }
    },
    [appliedSet, chartControls, locale],
  );

  const mainItems = CHART_QUICK_INDICATORS.filter((i) => i.kind === "main");
  const subItems = CHART_QUICK_INDICATORS.filter((i) => i.kind === "sub");

  const chip = (item: QuickIndicatorItem) => {
    const active = item.indicatorId ? appliedSet.has(item.indicatorId) : false;
    const label = isChineseLocale(locale) ? item.labelZh : item.labelEn;
    return (
      <button
        key={item.key}
        type="button"
        disabled={item.disabled || pending === item.key}
        onClick={() => toggle(item)}
        title={defLabel(item, locale)}
        className={cn(
          "shrink-0 px-1.5 py-0.5 text-[11px] font-medium transition",
          item.disabled
            ? "cursor-not-allowed text-[#4a4a4a]"
            : active
              ? "text-white"
              : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
          pending === item.key && "opacity-60",
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="flex h-8 items-center gap-1 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {mainItems.map(chip)}
          <span className="mx-1.5 h-3 w-px shrink-0 bg-[#2a2a2a]" />
          {subItems.map(chip)}
        </div>
        <span className="shrink-0 text-[10px] text-[var(--terminal-muted)]">
          {isChineseLocale(locale) ? "副" : "Sub"}({subCount}/{MAX_SUB_INDICATORS})
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="shrink-0 rounded p-1 text-[var(--terminal-muted)] hover:bg-[var(--terminal-panel)] hover:text-[var(--terminal-text)]"
          title={isChineseLocale(locale) ? "指标设置" : "Indicator settings"}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <IndicatorSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        chartControls={chartControls}
      />
    </>
  );
}

function defLabel(item: QuickIndicatorItem, locale: Locale) {
  if (!item.indicatorId) return item.labelZh;
  const def = getIndicatorById(item.indicatorId);
  if (!def) return item.labelZh;
  return isChineseLocale(locale) ? def.labelZh : def.labelEn;
}
