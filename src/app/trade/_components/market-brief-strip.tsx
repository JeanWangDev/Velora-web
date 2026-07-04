"use client";

import { ChevronRight, Loader2, X } from "lucide-react";
import type { MarketBrief, BriefLight } from "@/app/trade/_types/market-brief";
import { useTranslation } from "@/i18n/use-translation";

const STRIP_HIDDEN_KEY = "trade-brief-strip-hidden-v1";

type MarketBriefStripProps = {
  brief: MarketBrief | null;
  loading: boolean;
  hidden: boolean;
  onHiddenChange: (hidden: boolean) => void;
  onOpenDetails: () => void;
};

function lightDot(light: BriefLight) {
  switch (light) {
    case "green":
      return "bg-emerald-500";
    case "red":
      return "bg-rose-500";
    default:
      return "bg-amber-500";
  }
}

export function loadBriefStripHidden(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STRIP_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveBriefStripHidden(hidden: boolean) {
  try {
    localStorage.setItem(STRIP_HIDDEN_KEY, hidden ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function MarketBriefStrip({
  brief,
  loading,
  hidden,
  onHiddenChange,
  onOpenDetails,
}: MarketBriefStripProps) {
  const t = useTranslation();

  if (hidden) {
    return (
      <div className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-1">
        <button
          type="button"
          onClick={() => onHiddenChange(false)}
          className="text-xs text-accent hover:underline"
        >
          {t("trade.marketBrief.showStrip")}
        </button>
      </div>
    );
  }

  if (loading && !brief) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("trade.marketBrief.loading")}
      </div>
    );
  }

  if (!brief) return null;

  const changeUp = brief.change24hPct >= 0;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface/80 px-3 py-2 sm:px-4">
      <span className={`h-2 w-2 shrink-0 rounded-full ${lightDot(brief.light)}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-medium text-foreground">
            {t(`trade.marketBrief.light.${brief.light}` as const)}
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted">
            {brief.symbol} {brief.interval}
          </span>
          <span
            className={
              changeUp
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            24h {changeUp ? "+" : ""}
            {brief.change24hPct.toFixed(2)}%
          </span>
          <span className="text-muted">
            · {t(`trade.marketBrief.trend.${brief.trend}` as const)}
          </span>
          {brief.signalChange && brief.signalChange !== "unchanged" ? (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
              {t(`trade.marketBrief.change.${brief.signalChange}` as const)}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted">{brief.summary}</p>
      </div>
      <button
        type="button"
        onClick={onOpenDetails}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
      >
        {t("trade.marketBrief.details")}
        <ChevronRight className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onHiddenChange(true)}
        className="shrink-0 rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
        aria-label={t("trade.marketBrief.hideStrip")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
