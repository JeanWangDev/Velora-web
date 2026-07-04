"use client";

import { useCallback, useEffect, useState } from "react";
import { tvResolutionToCanonical } from "@/app/trade/_components/tv-chart/datafeed";
import type { MarketBrief } from "@/app/trade/_types/market-brief";
import type { TVResolution } from "@/app/trade/_types/chart";
import { MarketDataService } from "@/services/market-data-service";

export function useMarketBrief(symbol: string, interval: TVResolution) {
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canonicalInterval = tvResolutionToCanonical(interval);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MarketDataService.getMarketBrief({
        symbol,
        interval: canonicalInterval,
      });
      setBrief(data);
    } catch (err) {
      setBrief(null);
      setError(err instanceof Error ? err.message : "Failed to load brief");
    } finally {
      setLoading(false);
    }
  }, [canonicalInterval, symbol]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 90_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { brief, loading, error, refresh, canonicalInterval };
}
