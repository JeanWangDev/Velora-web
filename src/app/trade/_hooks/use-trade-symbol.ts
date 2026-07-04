"use client";

import { useCallback, useState } from "react";
import { useLocalStorageState, useMount } from "ahooks";
import { normalizeTradingPair } from "@/utils/symbol";

export const TRADE_SYMBOL_STORAGE_KEY = "trade-last-symbol";

export function useTradeSymbol(allowedSymbols: string[], defaultSymbol: string) {
  const [hydrated, setHydrated] = useState(false);
  useMount(() => setHydrated(true));

  const [stored, setStoredRaw] = useLocalStorageState<string>(
    TRADE_SYMBOL_STORAGE_KEY,
    {
      defaultValue: defaultSymbol,
      listenStorageChange: true,
    },
  );

  const symbol = normalizeTradingPair(
    hydrated ? stored : defaultSymbol,
    allowedSymbols,
    defaultSymbol,
  );

  const setSymbol = useCallback(
    (next: string) => {
      const normalized = normalizeTradingPair(next, allowedSymbols, defaultSymbol);
      setStoredRaw(normalized);
    },
    [allowedSymbols, defaultSymbol, setStoredRaw],
  );

  return { symbol, setSymbol, hydrated };
}
