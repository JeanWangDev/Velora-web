"use client";

import { useEffect } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMarketConnectionStatus } from "@/hooks/use-market-connection-status";
import { useMockMarketStore } from "@/stores/use-mock-market-store";

/** Starts mock ticker updates app-wide (3s interval). Pauses when offline. */
export function MockMarketTicker() {
  const tick = useMockMarketStore((s) => s.tick);
  const status = useMarketConnectionStatus();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated || status === "offline") return;
    const id = window.setInterval(() => tick(), 3000);
    return () => window.clearInterval(id);
  }, [tick, status, hydrated]);

  return null;
}
