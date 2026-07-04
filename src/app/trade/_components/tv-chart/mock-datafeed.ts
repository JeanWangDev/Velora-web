/**
 * Mock TradingView datafeed — uses Velora mock klines when API is unavailable.
 */
import { buildKlines, getSymbolMeta, MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import type {
  TVBar,
  TVDatafeed,
  TVLibrarySymbolInfo,
} from "@/types/charting-library";

const SUPPORTED_RESOLUTIONS = [
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
  "1D",
];

const RES_MINUTES: Record<string, number> = {
  "1": 1,
  "5": 5,
  "15": 15,
  "30": 30,
  "60": 60,
  "240": 240,
  "1D": 1440,
  D: 1440,
};

export function tvSymbolToVelora(tvSymbol: string): string {
  if (tvSymbol.includes("-")) return tvSymbol.toUpperCase();
  if (tvSymbol.endsWith("USDT")) {
    return `${tvSymbol.slice(0, -4)}-USDT`;
  }
  return tvSymbol.toUpperCase();
}

export function veloraSymbolToTv(veloraSymbol: string): string {
  return veloraSymbol.replace("-", "").toUpperCase();
}

const tickers = new Map<string, ReturnType<typeof setInterval>>();

function pricescaleFor(symbol: string): number {
  const meta = getSymbolMeta(tvSymbolToVelora(symbol));
  if (!meta) return 100;
  return 10 ** meta.pricePrecision;
}

function resolveInfo(tvSymbol: string): TVLibrarySymbolInfo {
  const velora = tvSymbolToVelora(tvSymbol);
  const meta = getSymbolMeta(velora);
  return {
    name: veloraSymbolToTv(velora),
    full_name: `Velora:${veloraSymbolToTv(velora)}`,
    description: meta?.displayName ?? velora,
    type: "crypto",
    session: "24x7",
    timezone: "Etc/UTC",
    ticker: veloraSymbolToTv(velora),
    exchange: "Velora",
    listed_exchange: "Velora",
    format: "price",
    pricescale: pricescaleFor(tvSymbol),
    minmov: 1,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: false,
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    volume_precision: 4,
    data_status: "streaming",
  };
}

export function createMockDatafeed(): TVDatafeed {
  return {
    onReady: (cb) => {
      setTimeout(
        () =>
          cb({
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            exchanges: [{ value: "Velora", name: "Velora", desc: "Velora" }],
          }),
        0,
      );
    },

    searchSymbols: (input, _ex, _type, onResult) => {
      const q = input.toLowerCase();
      const items = MOCK_SYMBOLS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.base.toLowerCase().includes(q),
      ).map((s) => ({
        symbol: veloraSymbolToTv(s.symbol),
        full_name: `Velora:${veloraSymbolToTv(s.symbol)}`,
        description: s.displayName,
        exchange: "Velora",
        ticker: veloraSymbolToTv(s.symbol),
        type: "crypto",
      }));
      onResult(items);
    },

    resolveSymbol: (name, resolve, reject) => {
      const velora = tvSymbolToVelora(name);
      if (!getSymbolMeta(velora)) {
        reject("unknown symbol");
        return;
      }
      resolve(resolveInfo(name));
    },

    getBars: (symbolInfo, resolution, _from, _to, onResult) => {
      const velora = tvSymbolToVelora(symbolInfo.name);
      const minutes = RES_MINUTES[resolution] ?? 60;
      const bars = buildKlines(velora, minutes, 300);
      const tvBars: TVBar[] = bars.map((b) => ({
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      }));
      onResult(tvBars, { noData: tvBars.length === 0 });
    },

    subscribeBars: (symbolInfo, resolution, onTick, listenerGuid) => {
      const velora = tvSymbolToVelora(symbolInfo.name);
      const minutes = RES_MINUTES[resolution] ?? 60;
      const id = setInterval(() => {
        const tickersState = useMockMarketStore.getState().tickers;
        const last = tickersState[velora]?.last;
        if (!last) return;
        const now = Date.now();
        onTick({
          time: Math.floor(now / (minutes * 60_000)) * minutes * 60_000,
          open: last,
          high: last,
          low: last,
          close: last,
          volume: Math.random() * 10,
        });
      }, 2000);
      tickers.set(listenerGuid, id);
    },

    unsubscribeBars: (listenerGuid) => {
      const id = tickers.get(listenerGuid);
      if (id) clearInterval(id);
      tickers.delete(listenerGuid);
    },
  };
}
