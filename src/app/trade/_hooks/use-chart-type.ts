"use client";

import { useCallback, useState } from "react";
import { useLocalStorageState, useMount } from "ahooks";
import {
  CHART_TYPE_STORAGE_KEY,
  DEFAULT_CHART_TYPE,
  normalizeChartType,
} from "@/app/trade/_config/chart-types";
import type { TVSeriesStyle } from "@/app/trade/_types/chart";

function deserializeChartType(text: string): TVSeriesStyle {
  try {
    const parsed = JSON.parse(text);
    return normalizeChartType(typeof parsed === "number" ? parsed : Number(parsed));
  } catch {
    return normalizeChartType(Number(text));
  }
}

export function useChartType() {
  const [hydrated, setHydrated] = useState(false);
  useMount(() => setHydrated(true));

  const [chartType, setChartTypeRaw] = useLocalStorageState<TVSeriesStyle>(
    CHART_TYPE_STORAGE_KEY,
    {
      defaultValue: DEFAULT_CHART_TYPE,
      deserializer: deserializeChartType,
      listenStorageChange: true,
    },
  );

  const setChartType = useCallback(
    (next: TVSeriesStyle) => {
      setChartTypeRaw(normalizeChartType(next));
    },
    [setChartTypeRaw],
  );

  return {
    chartType: normalizeChartType(chartType ?? DEFAULT_CHART_TYPE),
    setChartType,
    hydrated,
  };
}
