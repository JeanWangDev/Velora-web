"use client";

import { create } from "zustand";
import { SpotService, type ServerSpotSymbol } from "@/services/spot-service";
import { FuturesService } from "@/services/futures-service";
import { useMarketStore } from "@/stores/use-market-store";
import { futuresInstIdToSpot, futuresSymbolsEqual } from "@/utils/symbol";
import type { MarketSymbol } from "@/types/exchange";

function spotToMeta(s: ServerSpotSymbol): MarketSymbol {
  return {
    symbol: s.symbol,
    base: s.base,
    quote: s.quote,
    displayName: s.displayName,
    pricePrecision: s.pricePrecision,
    qtyPrecision: s.qtyPrecision,
    minQty: s.minQty,
    status: s.status,
  };
}

interface SymbolRegistryState {
  spotSymbols: MarketSymbol[];
  futuresSymbols: MarketSymbol[];
  loaded: boolean;
  hydrate: () => Promise<void>;
  getMeta: (symbol: string) => MarketSymbol | undefined;
  allSpot: () => MarketSymbol[];
  isValidSymbol: (symbol: string, kind?: "spot" | "futures") => boolean;
}

export const useSymbolRegistry = create<SymbolRegistryState>((set, get) => ({
  spotSymbols: [],
  futuresSymbols: [],
  loaded: false,

  hydrate: async () => {
    try {
      const [spotRes, futuresRes] = await Promise.all([
        SpotService.listSymbols(),
        FuturesService.listSymbols(),
      ]);
      const spotSymbols = (spotRes.data ?? []).map(spotToMeta);
      const futuresSymbols = (futuresRes.data ?? []).map((s) => ({
        symbol: s.symbol,
        base: s.base,
        quote: s.quote,
        displayName: `${s.base} Perp`,
        pricePrecision: s.pricePrecision,
        qtyPrecision: s.qtyPrecision,
        minQty: s.minQty,
        status: s.status,
      }));
      set({ spotSymbols, futuresSymbols, loaded: true });
      if (spotSymbols.length > 0) {
        void useMarketStore
          .getState()
          .hydrateTickers(spotSymbols.map((s) => s.symbol));
      }
    } catch {
      set({ spotSymbols: [], futuresSymbols: [], loaded: true });
    }
  },

  getMeta: (symbol) => {
    const { spotSymbols, futuresSymbols } = get();
    const upper = symbol.toUpperCase();
    const hit =
      spotSymbols.find((s) => s.symbol === upper) ??
      futuresSymbols.find((s) => s.symbol === upper) ??
      futuresSymbols.find((s) => futuresSymbolsEqual(s.symbol, upper));
    if (hit) {
      if (hit.symbol.endsWith("-SWAP")) {
        const spot = futuresInstIdToSpot(hit.symbol);
        return { ...hit, symbol: spot };
      }
      return hit;
    }

    const dash = upper.includes("-") ? upper : null;
    if (dash) {
      const [base, quote] = dash.split("-");
      if (base && quote) {
        return {
          symbol: dash,
          base,
          quote,
          displayName: base,
          pricePrecision: 8,
          qtyPrecision: 8,
          minQty: 0,
          status: "trading" as const,
        };
      }
    }
    return undefined;
  },

  allSpot: () => get().spotSymbols,

  isValidSymbol: (symbol, kind = "spot") => {
    const upper = symbol.toUpperCase();
    if (kind === "futures") {
      return get().futuresSymbols.some((s) => futuresSymbolsEqual(s.symbol, upper));
    }
    if (get().spotSymbols.some((s) => s.symbol === upper)) return true;
    return /^[A-Z0-9]+-USDT$/.test(upper);
  },
}));

/** 非 React 环境也可用的元数据查询 */
export function getSymbolMeta(symbol: string): MarketSymbol | undefined {
  return useSymbolRegistry.getState().getMeta(symbol);
}

export function getSpotSymbols(): MarketSymbol[] {
  return useSymbolRegistry.getState().allSpot();
}

export function getFuturesSymbols(): MarketSymbol[] {
  return useSymbolRegistry.getState().futuresSymbols;
}
