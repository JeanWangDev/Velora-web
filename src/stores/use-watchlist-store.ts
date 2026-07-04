"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  symbols: string[];
  toggle: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: ["BTC-USDT", "ETH-USDT"],
      toggle: (symbol) => {
        const { symbols } = get();
        set({
          symbols: symbols.includes(symbol)
            ? symbols.filter((s) => s !== symbol)
            : [...symbols, symbol],
        });
      },
      isWatched: (symbol) => get().symbols.includes(symbol),
    }),
    { name: "velora-watchlist" },
  ),
);
