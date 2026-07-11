"use client";

import { create } from "zustand";
import { SpotService, type ServerSpotSymbol } from "@/services/spot-service";
import { FuturesService } from "@/services/futures-service";
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
    } catch {
      set({ loaded: true });
    }
  },

  getMeta: (symbol) => {
    const { spotSymbols, futuresSymbols } = get();
    const upper = symbol.toUpperCase();
    return (
      spotSymbols.find((s) => s.symbol === upper) ??
      futuresSymbols.find((s) => s.symbol === upper) ??
      spotSymbols.find((s) => upper.startsWith(s.base))
    );
  },

  allSpot: () => get().spotSymbols,

  isValidSymbol: (symbol, kind = "spot") => {
    const upper = symbol.toUpperCase();
    if (kind === "futures") {
      return get().futuresSymbols.some((s) => s.symbol === upper);
    }
    return get().spotSymbols.some((s) => s.symbol === upper);
  },
}));

/** 非 React 环境也可用的元数据查询 */
export function getSymbolMeta(symbol: string): MarketSymbol | undefined {
  return useSymbolRegistry.getState().getMeta(symbol);
}

export function getSpotSymbols(): MarketSymbol[] {
  return useSymbolRegistry.getState().allSpot();
}
