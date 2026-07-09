"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  CHART_QUICK_INDICATORS,
  MAX_SUB_INDICATORS,
} from "@/app/trade/_config/chart-quick-indicators";
import { getIndicatorById } from "@/app/trade/_config/indicators";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { useLocale } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

type SettingsTab = "main" | "sub";

export function IndicatorSettingsModal({
  open,
  onClose,
  chartControls,
}: {
  open: boolean;
  onClose: () => void;
  chartControls: TVChartControls | null;
}) {
  const locale = useLocale();
  const [tab, setTab] = useState<SettingsTab>("main");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !chartControls) return;
    const ids = chartControls.getAppliedIndicatorIds();
    setAppliedIds(ids);
    setDraftIds(ids);
    return chartControls.subscribeAppliedIndicators((next) => {
      setAppliedIds(next);
      if (!submitting) setDraftIds(next);
    });
  }, [open, chartControls, submitting]);

  const pool = useMemo(
    () => CHART_QUICK_INDICATORS.filter((i) => i.kind === tab && i.indicatorId),
    [tab],
  );

  const subDraftCount = useMemo(() => {
    const subIds = new Set(
      CHART_QUICK_INDICATORS.filter((i) => i.kind === "sub" && i.indicatorId).map(
        (i) => i.indicatorId!,
      ),
    );
    return draftIds.filter((id) => subIds.has(id)).length;
  }, [draftIds]);

  if (!open) return null;

  const toggle = (id: string, checked: boolean) => {
    setDraftIds((prev) => {
      if (checked) {
        if (tab === "sub") {
          const subIds = new Set(
            CHART_QUICK_INDICATORS.filter((i) => i.kind === "sub" && i.indicatorId).map(
              (i) => i.indicatorId!,
            ),
          );
          const nextSubs = prev.filter((x) => subIds.has(x));
          if (!prev.includes(id) && nextSubs.length >= MAX_SUB_INDICATORS) {
            toast.info(
              locale === "zh"
                ? `副指标最多 ${MAX_SUB_INDICATORS} 个`
                : `Max ${MAX_SUB_INDICATORS} sub-indicators`,
            );
            return prev;
          }
        }
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const reset = () => setDraftIds(appliedIds);

  const confirm = async () => {
    if (!chartControls) return;
    const draftSet = new Set(draftIds);
    const appliedSet = new Set(appliedIds);
    const toAdd = draftIds.filter((id) => !appliedSet.has(id));
    const toRemove = appliedIds.filter((id) => !draftSet.has(id));
    setSubmitting(true);
    try {
      await chartControls.applyIndicators(toAdd, toRemove);
      const next = chartControls.getAppliedIndicatorIds();
      setAppliedIds(next);
      setDraftIds(next);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = pool.find((p) => draftIds.includes(p.indicatorId!));
  const selectedDef = selected?.indicatorId
    ? getIndicatorById(selected.indicatorId)
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(80vh,480px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--terminal-border)] bg-[var(--terminal-bg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--terminal-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">
              {locale === "zh" ? "指标" : "Indicators"}
            </h2>
            {(
              [
                { key: "main" as const, label: locale === "zh" ? "主指标" : "Main" },
                {
                  key: "sub" as const,
                  label:
                    locale === "zh"
                      ? `副指标(${subDraftCount}/${MAX_SUB_INDICATORS})`
                      : `Sub (${subDraftCount}/${MAX_SUB_INDICATORS})`,
                },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "text-xs",
                  tab === item.key
                    ? "font-medium text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[180px_1fr]">
          <div className="terminal-scroll overflow-y-auto border-r border-[var(--terminal-border)] p-2">
            {pool.map((item) => {
              const id = item.indicatorId!;
              const def = getIndicatorById(id);
              const checked = draftIds.includes(id);
              return (
                <label
                  key={item.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-[var(--terminal-panel)]",
                    checked && "bg-[var(--terminal-panel)]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(id, e.target.checked)}
                    className="rounded border-[var(--terminal-border)]"
                  />
                  <span>{locale === "zh" ? item.labelZh : item.labelEn}</span>
                  {def && (
                    <span className="ml-auto truncate text-[10px] text-muted">
                      {locale === "zh" ? def.labelZh : def.labelEn}
                    </span>
                  )}
                </label>
              );
            })}
            {CHART_QUICK_INDICATORS.filter((i) => i.kind === tab && i.disabled).map(
              (item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted/40"
                >
                  <input type="checkbox" disabled className="rounded" />
                  {locale === "zh" ? item.labelZh : item.labelEn}
                  <span className="ml-auto text-[10px]">
                    {locale === "zh" ? "即将上线" : "Soon"}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="terminal-scroll overflow-y-auto p-4 text-xs">
            {selectedDef ? (
              <>
                <h3 className="font-medium">
                  {locale === "zh" ? selectedDef.labelZh : selectedDef.labelEn}
                </h3>
                <p className="mt-3 leading-relaxed text-muted">
                  {locale === "zh" ? "指标说明" : "Description"} · TradingView{" "}
                  {selectedDef.tvStudyName}
                </p>
                <p className="mt-2 text-[11px] text-muted/80">
                  {locale === "zh"
                    ? "参数与颜色可在 TradingView 图表内右键指标进一步调整。"
                    : "Adjust parameters via TradingView chart context menu."}
                </p>
              </>
            ) : (
              <p className="text-muted">
                {locale === "zh"
                  ? "勾选左侧指标，确认后应用到 K 线。"
                  : "Select indicators on the left, then confirm."}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--terminal-border)] px-4 py-3">
          <button
            type="button"
            onClick={reset}
            className="rounded px-4 py-1.5 text-xs text-muted hover:text-foreground"
          >
            {locale === "zh" ? "重置" : "Reset"}
          </button>
          <button
            type="button"
            disabled={submitting || !chartControls}
            onClick={confirm}
            className="rounded-full bg-foreground px-5 py-1.5 text-xs font-medium text-background disabled:opacity-50"
          >
            {locale === "zh" ? "确认" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
