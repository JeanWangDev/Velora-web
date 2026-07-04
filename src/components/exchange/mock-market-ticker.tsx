"use client";

import { useEffect } from "react";
import { useMockMarketStore } from "@/stores/use-mock-market-store";

/** Starts mock ticker updates app-wide (3s interval). */
export function MockMarketTicker() {
  const tick = useMockMarketStore((s) => s.tick);

  useEffect(() => {
    const id = window.setInterval(() => tick(), 3000);
    return () => window.clearInterval(id);
  }, [tick]);

  return null;
}
