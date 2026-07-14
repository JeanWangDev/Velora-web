"use client";

import { create } from "zustand";
import { MarketDataService } from "@/services/market-data-service";
import { SpotService } from "@/services/spot-service";
import { getMarketStreamClient } from "@/services/market-stream-client";
import { veloraSymbolToTv } from "@/app/trade/_components/tv-chart/mock-datafeed";
import { binanceToVeloraSymbol } from "@/utils/binance-symbol";
import type { MarketTrade, OrderBook, Ticker } from "@/types/exchange";
import type { ITicker24h, ITradeTick } from "@/types/market";

interface MarketState {
  tickers: Record<string, Ticker>;
  orderBooks: Record<string, OrderBook>;
  recentTrades: Record<string, MarketTrade[]>;
  activeSymbol: string | null;
  initSymbol: (symbol: string) => void;
  /** 批量预拉 24h 行情，供交易对列表/自选展示 */
  hydrateTickers: (symbols: string[]) => Promise<void>;
  refreshDepth: (symbol: string) => Promise<void>;
  disposeSymbol: (symbol: string) => void;
}

function tickerFrom24h(symbol: string, t: ITicker24h): Ticker {
  return {
    symbol,
    last: t.lastPrice,
    change24h: t.priceChangePercent,
    high24h: t.highPrice,
    low24h: t.lowPrice,
    volume24h: t.volume,
    quoteVolume24h: t.quoteVolume,
  };
}

function tradeFromTick(symbol: string, tick: ITradeTick): MarketTrade {
  return {
    id: `${symbol}-${tick.time}`,
    price: tick.price,
    qty: tick.quantity,
    side: tick.isBuyerMaker ? "sell" : "buy",
    ts: tick.time,
  };
}

const subs = new Map<string, { unsubTicker?: () => void; unsubTrade?: () => void }>();

export const useMarketStore = create<MarketState>((set, get) => ({
  tickers: {},
  orderBooks: {},
  recentTrades: {},
  activeSymbol: null,

  initSymbol: (symbol) => {
    const upstream = veloraSymbolToTv(symbol);
    set({ activeSymbol: symbol });

    if (!get().tickers[symbol]) {
      void MarketDataService.getTicker24h(upstream).then((t) => {
        set((s) => ({
          tickers: { ...s.tickers, [symbol]: tickerFrom24h(symbol, t) },
        }));
      });
    }

    void get().refreshDepth(symbol);

    const existing = subs.get(symbol);
    if (existing) return;

    const stream = getMarketStreamClient();
    const unsubTicker = stream.subscribeTicker("binance", upstream, (t) => {
      set((s) => ({
        tickers: { ...s.tickers, [symbol]: tickerFrom24h(symbol, t) },
      }));
    });

    const unsubTrade = stream.subscribeTrades("binance", upstream, (tick) => {
      const trade = tradeFromTick(symbol, tick);
      set((s) => {
        const prev = s.recentTrades[symbol] ?? [];
        const next = [trade, ...prev.filter((x) => x.id !== trade.id)].slice(0, 50);
        return { recentTrades: { ...s.recentTrades, [symbol]: next } };
      });
    });

    subs.set(symbol, { unsubTicker, unsubTrade });
  },

  hydrateTickers: async (symbols) => {
    const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
    if (unique.length === 0) return;

    try {
      const all = await MarketDataService.getTickers24h("USDT");
      const want = new Set(unique);
      set((s) => {
        const tickers = { ...s.tickers };
        for (const row of all) {
          const velora = binanceToVeloraSymbol(row.symbol);
          if (!want.has(velora)) continue;
          tickers[velora] = tickerFrom24h(velora, row);
        }
        return { tickers };
      });
      return;
    } catch {
      /* 批量失败时回退逐币拉取 */
    }

    const missing = unique.filter((symbol) => !get().tickers[symbol]);
    if (missing.length === 0) return;

    const results = await Promise.allSettled(
      missing.map(async (symbol) => {
        const upstream = veloraSymbolToTv(symbol);
        const t = await MarketDataService.getTicker24h(upstream);
        return { symbol, ticker: tickerFrom24h(symbol, t) };
      }),
    );

    set((s) => {
      const tickers = { ...s.tickers };
      for (const result of results) {
        if (result.status === "fulfilled") {
          tickers[result.value.symbol] = result.value.ticker;
        }
      }
      return { tickers };
    });
  },

  refreshDepth: async (symbol) => {
    try {
      const book = await SpotService.getOrderBook(symbol, 50);
      set((s) => ({
        orderBooks: {
          ...s.orderBooks,
          [symbol]: {
            bids: book.bids.map((l) => ({ price: l.price, qty: l.quantity })),
            asks: book.asks.map((l) => ({ price: l.price, qty: l.quantity })),
          },
        },
        tickers: {
          ...s.tickers,
          [symbol]: {
            ...(s.tickers[symbol] ?? {
              symbol,
              change24h: 0,
              high24h: book.lastPrice,
              low24h: book.lastPrice,
              volume24h: 0,
              quoteVolume24h: 0,
            }),
            last: book.lastPrice,
          },
        },
      }));
    } catch {
      /* 深度拉取失败时保留上次快照 */
    }
  },

  disposeSymbol: (symbol) => {
    const sub = subs.get(symbol);
    sub?.unsubTicker?.();
    sub?.unsubTrade?.();
    subs.delete(symbol);
  },
}));

/** 全局轮询深度（OKX 盘口刷新节奏） */
let depthTimer: ReturnType<typeof setInterval> | null = null;

export function startMarketDepthPolling(symbol: string, intervalMs = 2000) {
  if (depthTimer) clearInterval(depthTimer);
  depthTimer = setInterval(() => {
    void useMarketStore.getState().refreshDepth(symbol);
  }, intervalMs);
}

export function stopMarketDepthPolling() {
  if (depthTimer) {
    clearInterval(depthTimer);
    depthTimer = null;
  }
}
