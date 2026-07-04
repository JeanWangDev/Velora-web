"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { tvResolutionToCanonical } from "@/app/trade/_components/tv-chart/datafeed";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import {
  DEFAULT_PRICE_LEVELS_STATE,
  type PriceLevelsMode,
  type PriceLevelsState,
} from "@/app/trade/_types/price-levels";
import type { TVResolution } from "@/app/trade/_types/chart";
import { MarketDataService } from "@/services/market-data-service";
import { useTranslation } from "@/i18n/use-translation";

const STORAGE_KEY = "trade-price-levels-v1";

type PriceLevelsPanelProps = {
  symbol: string;
  interval: TVResolution;
  chartControls: TVChartControls | null;
  /** 递增时自动开启支撑/压力（从盘面助手跳转） */
  enableRequest?: number;
};

function loadState(): PriceLevelsState {
  if (typeof window === "undefined") return DEFAULT_PRICE_LEVELS_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRICE_LEVELS_STATE;
    return { ...DEFAULT_PRICE_LEVELS_STATE, ...JSON.parse(raw) } as PriceLevelsState;
  } catch {
    return DEFAULT_PRICE_LEVELS_STATE;
  }
}

function saveState(state: PriceLevelsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function parseManualLevels(values: [string, string, string]): number[] {
  return values
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

export function PriceLevelsPanel({
  symbol,
  interval,
  chartControls,
  enableRequest = 0,
}: PriceLevelsPanelProps) {
  const t = useTranslation();
  const [state, setState] = useState<PriceLevelsState>(DEFAULT_PRICE_LEVELS_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLevels, setAutoLevels] = useState<{
    price: number;
    supports: number[];
    resistances: number[];
  } | null>(null);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || enableRequest <= 0) return;
    setState((prev) => {
      if (prev.enabled && prev.mode === "auto") return prev;
      const next = { ...prev, enabled: true, mode: "auto" as const };
      saveState(next);
      return next;
    });
  }, [enableRequest, hydrated]);

  const canonicalInterval = useMemo(
    () => tvResolutionToCanonical(interval),
    [interval],
  );

  const updateState = useCallback((patch: Partial<PriceLevelsState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !state.enabled || state.mode !== "auto") {
      setAutoLevels(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void MarketDataService.getPriceLevels({
      symbol,
      interval: canonicalInterval,
      limit: 3,
    })
      .then((result) => {
        if (cancelled) return;
        setAutoLevels({
          price: result.price,
          supports: result.supports,
          resistances: result.resistances,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAutoLevels(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canonicalInterval, hydrated, state.enabled, state.mode, symbol]);

  useEffect(() => {
    if (!chartControls || !hydrated) return;

    if (!state.enabled) {
      chartControls.clearPriceLevels();
      return;
    }

    const supports =
      state.mode === "auto"
        ? (autoLevels?.supports ?? [])
        : parseManualLevels(state.manualSupports);
    const resistances =
      state.mode === "auto"
        ? (autoLevels?.resistances ?? [])
        : parseManualLevels(state.manualResistances);

    if (state.mode === "auto" && loading) {
      return;
    }

    if (supports.length === 0 && resistances.length === 0) {
      chartControls.clearPriceLevels();
      return;
    }

    chartControls.setPriceLevels({ supports, resistances });
  }, [autoLevels, chartControls, hydrated, loading, state]);

  const renderLevelRow = (
    label: string,
    colorClass: string,
    values: number[] | [string, string, string],
    manualKey: "manualSupports" | "manualResistances",
  ) => (
    <div className="space-y-2">
      <p className={`text-xs font-semibold ${colorClass}`}>{label}</p>
      {state.mode === "auto" ? (
        <div className="space-y-1">
          {(values as number[]).length > 0 ? (
            (values as number[]).map((price, index) => (
              <div
                key={`${label}-${index}`}
                className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm font-medium text-foreground"
              >
                {label} {index + 1}: {formatPrice(price)}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted">{t("trade.priceLevels.emptyAuto")}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <input
              key={`${manualKey}-${index}`}
              type="number"
              step="any"
              value={state[manualKey][index]}
              onChange={(event) => {
                const next = [...state[manualKey]] as [string, string, string];
                next[index] = event.target.value;
                updateState({ [manualKey]: next });
              }}
              placeholder={`${label} ${index + 1}`}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          ))}
        </div>
      )}
    </div>
  );

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 px-4 py-4">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("trade.priceLevels.enable")}
            </p>
            <p className="text-xs text-muted">{t("trade.priceLevels.enableHint")}</p>
          </div>
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(event) => updateState({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
        </label>

        {state.enabled ? (
          <>
            <div className="flex rounded-md border border-border bg-surface p-0.5 text-xs">
              {(["auto", "manual"] as PriceLevelsMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateState({ mode })}
                  className={`flex-1 rounded px-2 py-1.5 font-medium transition ${
                    state.mode === mode
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {mode === "auto"
                    ? t("trade.priceLevels.modeAuto")
                    : t("trade.priceLevels.modeManual")}
                </button>
              ))}
            </div>

            {loading && state.mode === "auto" ? (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("trade.priceLevels.loading")}
              </div>
            ) : null}

            {state.mode === "auto" && autoLevels ? (
              <p className="text-xs text-muted">
                {t("trade.priceLevels.currentPrice")}: {formatPrice(autoLevels.price)}
              </p>
            ) : null}

            {renderLevelRow(
              t("trade.priceLevels.supports"),
              "text-blue-500",
              state.mode === "auto" ? (autoLevels?.supports ?? []) : state.manualSupports,
              "manualSupports",
            )}

            <div className="border-t border-border" />

            {renderLevelRow(
              t("trade.priceLevels.resistances"),
              "text-rose-500",
              state.mode === "auto"
                ? (autoLevels?.resistances ?? [])
                : state.manualResistances,
              "manualResistances",
            )}

            <p className="text-[11px] leading-relaxed text-muted">
              {t("trade.priceLevels.disclaimer")}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
