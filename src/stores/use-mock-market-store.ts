"use client";

import { create } from "zustand";
import {
  buildOrderBook,
  buildRecentTrades,
  createInitialTickers,
  jitterTicker,
  MOCK_SYMBOLS,
} from "@/mocks/exchange-data";
import type { MarketTrade, OrderBook, Ticker } from "@/types/exchange";

interface MockMarketState {
  tickers: Record<string, Ticker>;
  orderBooks: Record<string, OrderBook>;
  recentTrades: Record<string, MarketTrade[]>;
  initSymbol: (symbol: string) => void;
  tick: () => void;
}

function createInitialBooks(tickers: Record<string, Ticker>) {
  const orderBooks: Record<string, OrderBook> = {};
  const recentTrades: Record<string, MarketTrade[]> = {};
  for (const s of MOCK_SYMBOLS) {
    const t = tickers[s.symbol];
    if (!t) continue;
    orderBooks[s.symbol] = buildOrderBook(t.last);
    recentTrades[s.symbol] = buildRecentTrades(t.last, s.symbol);
  }
  return { orderBooks, recentTrades };
}

const initialTickers = createInitialTickers();
const { orderBooks: initialBooks, recentTrades: initialTrades } =
  createInitialBooks(initialTickers);

export const useMockMarketStore = create<MockMarketState>((set, get) => ({
  tickers: initialTickers,
  orderBooks: initialBooks,
  recentTrades: initialTrades,

  initSymbol: (symbol) => {
    const { tickers, orderBooks, recentTrades } = get();
    if (orderBooks[symbol] && recentTrades[symbol]) return;
    const ticker = tickers[symbol];
    if (!ticker) return;
    set({
      orderBooks: {
        ...orderBooks,
        [symbol]: buildOrderBook(ticker.last),
      },
      recentTrades: {
        ...recentTrades,
        [symbol]: buildRecentTrades(ticker.last, symbol),
      },
    });
  },

  tick: () => {
    const { tickers, orderBooks, recentTrades } = get();
    const nextTickers: Record<string, Ticker> = {};
    const nextBooks: Record<string, OrderBook> = { ...orderBooks };
    const nextTrades: Record<string, MarketTrade[]> = { ...recentTrades };

    for (const [sym, t] of Object.entries(tickers)) {
      const updated = jitterTicker(t);
      nextTickers[sym] = updated;
      if (orderBooks[sym]) {
        nextBooks[sym] = buildOrderBook(updated.last);
      }
      if (recentTrades[sym]) {
        const trades = [...recentTrades[sym]];
        trades.unshift({
          id: `${sym}-${Date.now()}`,
          price: updated.last,
          qty: Math.random() * 0.3 + 0.01,
          side: Math.random() > 0.5 ? "buy" : "sell",
          ts: Date.now(),
        });
        nextTrades[sym] = trades.slice(0, 50);
      }
    }

    set({ tickers: nextTickers, orderBooks: nextBooks, recentTrades: nextTrades });
  },
}));
