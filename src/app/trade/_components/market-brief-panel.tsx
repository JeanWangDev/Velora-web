"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Loader2,
  Minus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { PanelTab } from "@/app/trade/_types/chart";
import type { MarketBrief, BriefLight } from "@/app/trade/_types/market-brief";
import { useTranslation } from "@/i18n/use-translation";

const PRO_MODE_KEY = "trade-market-brief-pro-v1";

type MarketBriefPanelProps = {
  brief: MarketBrief | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigatePanel?: (panel: PanelTab) => void;
};

function loadProMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PRO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveProMode(pro: boolean) {
  try {
    localStorage.setItem(PRO_MODE_KEY, pro ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function lightStyles(light: BriefLight) {
  switch (light) {
    case "green":
      return { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600" };
    case "red":
      return { dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-600" };
    default:
      return { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600" };
  }
}

function checkStatusClass(status: MarketBrief["checks"][number]["status"]) {
  switch (status) {
    case "ok":
      return "border-emerald-500/30 bg-emerald-500/5";
    case "bad":
      return "border-rose-500/30 bg-rose-500/5";
    default:
      return "border-border bg-background/60";
  }
}

function checkIcon(id: string, status: MarketBrief["checks"][number]["status"]) {
  if (id === "trend") {
    return status === "ok" ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    ) : status === "bad" ? (
      <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted" />
    );
  }
  if (status === "ok") return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "bad") return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
}

function formatFactorValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (Math.abs(value) >= 1000) return value.toFixed(2);
    if (Math.abs(value) >= 1) return value.toFixed(4);
    return value.toFixed(6);
  }
  return String(value);
}

function formatLevel(value: number | null): string {
  if (value === null) return "—";
  return formatFactorValue(value);
}

export function MarketBriefPanel({
  brief,
  loading,
  error,
  onRefresh,
  onNavigatePanel,
}: MarketBriefPanelProps) {
  const t = useTranslation();
  const [proMode, setProMode] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setProMode(loadProMode());
  }, []);

  const lightLabel = useMemo(() => {
    if (!brief) return "";
    return t(`trade.marketBrief.light.${brief.light}` as const);
  }, [brief, t]);

  const actionLevelLabel = useMemo(() => {
    if (!brief) return "";
    return t(`trade.marketBrief.actionLevel.${brief.actionLevel}` as const);
  }, [brief, t]);

  if (loading && !brief) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <p className="text-sm text-muted">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent/40"
        >
          {t("trade.marketBrief.retry")}
        </button>
      </div>
    );
  }

  if (!brief) return null;

  const styles = lightStyles(brief.light);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}
              >
                {lightLabel}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                {brief.symbol} · {brief.interval}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{actionLevelLabel}</p>
            <p className="mt-1 text-xs text-muted">
              {t("trade.marketBrief.scoreSummary")
                .replace("{bullish}", String(brief.score.bullish))
                .replace("{bearish}", String(brief.score.bearish))
                .replace("{neutral}", String(brief.score.neutral))}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
            aria-label={t("trade.marketBrief.refresh")}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {brief.signalChange && brief.signalChange !== "unchanged" ? (
          <p className="rounded-md bg-accent/5 px-3 py-2 text-xs text-accent">
            {t(`trade.marketBrief.change.${brief.signalChange}` as const)}
            {brief.previousLight
              ? ` (${t(`trade.marketBrief.light.${brief.previousLight}` as const)} → ${lightLabel})`
              : null}
          </p>
        ) : null}

        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-sm leading-relaxed text-foreground">{brief.summary}</p>
          {!proMode ? (
            <p className="mt-2 text-xs leading-relaxed text-accent">{brief.actionHint}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Target className="h-3.5 w-3.5" />
            {t("trade.marketBrief.priceGuide")}
          </p>
          <div className="grid gap-2 text-xs">
            <div className="rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2">
              <p className="text-[10px] text-blue-600 dark:text-blue-400">
                {t("trade.marketBrief.entry")}
              </p>
              <p className="mt-0.5 text-foreground">{brief.priceGuide.entryHint}</p>
            </div>
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-[10px] text-muted">{t("trade.marketBrief.stop")}</p>
              <p className="mt-0.5 text-foreground">{brief.priceGuide.stopHint}</p>
            </div>
            <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2">
              <p className="text-[10px] text-rose-600 dark:text-rose-400">
                {t("trade.marketBrief.takeProfit")}
              </p>
              <p className="mt-0.5 text-foreground">{brief.priceGuide.takeProfitHint}</p>
            </div>
            <div className="flex gap-2 text-[11px] text-muted">
              <span>
                S: {formatLevel(brief.priceGuide.support)}
              </span>
              <span>
                R: {formatLevel(brief.priceGuide.resistance)}
              </span>
            </div>
          </div>
        </div>

        {brief.topEvent ? (
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] font-semibold text-muted">
              {t("trade.marketBrief.latestNews")}
            </p>
            <Link
              href={`/news/${brief.topEvent.id}`}
              className="mt-1 block text-xs leading-relaxed text-foreground hover:text-accent"
            >
              {brief.topEvent.title}
            </Link>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted">{t("trade.marketBrief.checks")}</p>
          {brief.checks.map((check) => {
            const clickable = Boolean(check.panel && onNavigatePanel);
            const Tag = clickable ? "button" : "div";
            return (
              <Tag
                key={check.id}
                type={clickable ? "button" : undefined}
                onClick={
                  clickable && check.panel
                    ? () => onNavigatePanel?.(check.panel as PanelTab)
                    : undefined
                }
                className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-xs text-foreground ${checkStatusClass(check.status)} ${
                  clickable ? "cursor-pointer transition hover:border-accent/40" : ""
                }`}
              >
                {checkIcon(check.id, check.status)}
                <span className="flex-1 leading-5">{check.label}</span>
                {clickable ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                ) : null}
              </Tag>
            );
          })}
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
          <span className="text-muted">{t("trade.marketBrief.proMode")}</span>
          <input
            type="checkbox"
            checked={proMode}
            onChange={(event) => {
              const next = event.target.checked;
              setProMode(next);
              saveProMode(next);
            }}
            className="h-4 w-4 rounded border-border"
          />
        </label>

        {proMode ? (
          <div className="space-y-2 rounded-lg border border-border bg-surface-muted/40 p-3">
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              className="flex w-full items-center justify-between text-xs font-medium text-foreground"
            >
              {t("trade.marketBrief.details")}
              {detailsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {detailsOpen ? (
              <div className="space-y-1.5 text-[11px] text-muted">
                {Object.entries(brief.factors).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="shrink-0">{key}</span>
                    <span className="text-right text-foreground">
                      {formatFactorValue(value)}
                    </span>
                  </div>
                ))}
                {brief.hits.length > 0 ? (
                  <p className="pt-1 text-[10px]">hits: {brief.hits.join(", ")}</p>
                ) : null}
                <p className="pt-1 text-[10px] leading-relaxed text-foreground">
                  {brief.actionHint}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-[10px] leading-relaxed text-muted">{brief.disclaimer}</p>
      </div>
    </div>
  );
}
