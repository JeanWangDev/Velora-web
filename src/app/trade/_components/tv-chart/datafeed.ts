/**
 * TV UDF 风格 datafeed：getBars 走 Web Worker 分片拉取（OKX 式 3+2 并发），
 * subscribeBars 走 MarketStreamClient。resolution → canonical 仅在此文件维护。
 */
import type { TVBar, TVDatafeed } from "@/types/charting-library";
import type {
  CanonicalInterval,
  IKline,
  IKlineTick,
  ITradeTick,
} from "@/types/market";
import { MarketWorkerManager } from "@/lib/web-worker/market-worker-manager";
import { getWorkerApiBaseUrl } from "@/config/api";
import { MarketDataService } from "@/services/market-data-service";
import { getMarketStreamClient } from "@/services/market-stream-client";
import { veloraSymbolToTv } from "@/app/trade/_components/tv-chart/mock-datafeed";

// ─── Resolution mapping ───────────────────────────────────────────────────────
//
// TradingView resolution strings → our backend's canonical intervals.
// The backend takes canonical strings exclusively, so this is the *only*
// place we have to think about TV's resolution syntax.
//
// TV 约定："1" = 1 分钟；"1W"/"W" = 周；"1M"/"M" = 月（勿与 Binance "1m" 混淆）。

/** TV 工具栏/页面传入的 resolution → 后端 canonical（全项目仅此表 + getBars 使用） */
const TV_TO_CANONICAL: Record<string, CanonicalInterval> = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  "360": "6h",
  "480": "8h",
  "720": "12h",
  D: "1d",
  "1D": "1d",
  "3D": "3d",
  W: "1w",
  "1W": "1w",
  M: "1M",
  "1M": "1M",
};

export function tvResolutionToCanonical(resolution: string): CanonicalInterval {
  return TV_TO_CANONICAL[resolution] ?? "1h";
}

const INTERVAL_MS: Record<CanonicalInterval, number> = {
  "1m": 60_000,
  "3m": 3 * 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
  "1h": 60 * 60_000,
  "2h": 2 * 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "6h": 6 * 60 * 60_000,
  "8h": 8 * 60 * 60_000,
  "12h": 12 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
  "3d": 3 * 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000,
  "1M": 28 * 24 * 60 * 60_000,
};

const SUPPORTED_RESOLUTIONS = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "60",
  "120",
  "240",
  "360",
  "480",
  "720",
  "1D",
  "3D",
  "1W",
  "1M",
];

const POPULAR_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "DOGEUSDT",
  "DOTUSDT",
  "MATICUSDT",
  "LINKUSDT",
  "UNIUSDT",
  "LTCUSDT",
  "ATOMUSDT",
  "NEARUSDT",
];

// ─── Heuristic pricescale ─────────────────────────────────────────────────────
//
// TradingView needs `pricescale = 10^displayDecimals`. Pulling the precise
// value from Binance's PRICE_FILTER is doable but adds an extra round-trip;
// the heuristic here matches what users see on Binance's own UI for ~99% of
// pairs and is more than good enough for an MVP.
//
function getPricescale(symbol: string): number {
  if (symbol.endsWith("BUSD") || symbol.endsWith("USDC")) return 10_000;
  if (
    symbol.startsWith("BTC") ||
    symbol.startsWith("ETH") ||
    symbol.startsWith("BNB")
  ) {
    return 100;
  }
  if (
    symbol.startsWith("DOGE") ||
    symbol.startsWith("SHIB") ||
    symbol.startsWith("PEPE")
  ) {
    return 100_000;
  }
  return 10_000;
}

// ─── 分段加载（OKX 策略）────────────────────────────────────────────────────
//
// 首屏：从 to 往前 ~303 根，3 路并行，每路 limit≈101（101×3=303）
// 左拖：在 TV [from,to] 内最多再拉 ~202 根，2 路并行，每路 limit≈101
// 边界对齐到 K 线周期；相同 TV 区间去重

const INIT_TOTAL_BARS = 303;
const INIT_SHARD_COUNT = 3;
const INIT_BARS_PER_SHARD = 101;

const LAZY_TOTAL_BARS = 202;
const LAZY_SHARD_COUNT = 2;
const LAZY_BARS_PER_SHARD = 101;

interface ShardRange {
  startTime: number;
  endTime: number;
  limit: number;
}

/** 将时间窗切成 shardCount 段，每段不超过 barsPerShardCap 根 K 线（供 Worker 并行请求） */
function buildBarShards(
  fromMs: number,
  toMs: number,
  intervalMs: number,
  shardCount: number,
  barsPerShardCap: number,
): ShardRange[] {
  const alignedFrom = Math.floor(fromMs / intervalMs) * intervalMs;
  const alignedTo = Math.floor(toMs / intervalMs) * intervalMs;

  if (alignedTo < alignedFrom) return [];

  const totalBars = Math.floor((alignedTo - alignedFrom) / intervalMs) + 1;
  if (totalBars <= 0) return [];

  const barsPerShard = Math.min(
    barsPerShardCap,
    Math.ceil(totalBars / shardCount),
  );
  const shards: ShardRange[] = [];

  for (let i = 0; i < shardCount; i++) {
    const barOffset = i * barsPerShard;
    if (barOffset >= totalBars) break;

    const barsInShard = Math.min(barsPerShard, totalBars - barOffset);
    const startTime = alignedFrom + barOffset * intervalMs;
    const endTime = startTime + (barsInShard - 1) * intervalMs;

    shards.push({
      startTime,
      endTime,
      // +1 兼容接口闭区间，与 trading-api 约定一致
      limit: barsInShard + 1,
    });
  }

  return shards;
}

/** 首屏：忽略 TV 过大的 from，只从 to 往前拉 INIT_TOTAL_BARS 根 */
function buildInitShards(toMs: number, intervalMs: number): ShardRange[] {
  const alignedTo = Math.floor(toMs / intervalMs) * intervalMs;
  const fetchFromMs = alignedTo - (INIT_TOTAL_BARS - 1) * intervalMs;

  return buildBarShards(
    fetchFromMs,
    alignedTo,
    intervalMs,
    INIT_SHARD_COUNT,
    INIT_BARS_PER_SHARD,
  );
}

/** 左拖补历史：在 TV [from,to] 内从 to 往前最多 LAZY_TOTAL_BARS 根 */
function buildLazyShards(
  fromMs: number,
  toMs: number,
  intervalMs: number,
): ShardRange[] {
  const alignedFrom = Math.ceil(fromMs / intervalMs) * intervalMs;
  const alignedTo = Math.floor(toMs / intervalMs) * intervalMs;

  if (alignedTo < alignedFrom) return [];

  const tvBarCount = Math.floor((alignedTo - alignedFrom) / intervalMs) + 1;
  const fetchBars = Math.min(tvBarCount, LAZY_TOTAL_BARS);
  const fetchFromMs = alignedTo - (fetchBars - 1) * intervalMs;

  return buildBarShards(
    Math.max(alignedFrom, fetchFromMs),
    alignedTo,
    intervalMs,
    LAZY_SHARD_COUNT,
    LAZY_BARS_PER_SHARD,
  );
}

/** 相同 symbol+resolution+TV 区间的 getBars 共用一个 Promise，避免重复打 Worker */
const inflightRequests = new Map<string, Promise<IKline[]>>();

function inflightKey(
  symbol: string,
  resolution: string,
  fromMs: number,
  toMs: number,
): string {
  return `${symbol}|${resolution}|${fromMs}|${toMs}`;
}

/** 多段并行结果按 time 去重、升序，消除分片边界重复 bar */
function mergeKlines(batches: IKline[][]): IKline[] {
  const seen = new Set<number>();
  const merged: IKline[] = [];

  for (const batch of batches) {
    for (const bar of batch) {
      if (!seen.has(bar.time)) {
        seen.add(bar.time);
        merged.push(bar);
      }
    }
  }

  merged.sort((a, b) => a.time - b.time);
  return merged;
}

/** 只返回 TV 本次请求的 [fromMs, toMs] 内的 K 线，避免多余数据干扰图表 */
function filterBarsByRange(
  bars: IKline[],
  fromMs: number,
  toMs: number,
): IKline[] {
  return bars.filter((bar) => bar.time >= fromMs && bar.time <= toMs);
}

// ─── Active subscription registry (for resetDatafeedState) ───────────────────

type ActiveSub = {
  cancelKline: () => void;
  cancelTrades: () => void;
  lastBar: TVBar | null;
};

const globalActiveSubs = new Map<string, ActiveSub>();

/** 每次 reset 递增，用于丢弃卸载后仍 resolve 的 getBars Promise */
let datafeedEpoch = 0;

function isStaleDatafeedRequest(epoch: number): boolean {
  return epoch !== datafeedEpoch;
}

/** widget 重建或路由离开前调用：取消 WS 订阅并丢弃进行中的历史 K 线回调 */
export function resetDatafeedState(): void {
  datafeedEpoch += 1;
  const stream = getMarketStreamClient();
  stream.pushSuppressErrorToasts();
  try {
    for (const state of globalActiveSubs.values()) {
      state.cancelKline();
      state.cancelTrades();
    }
    globalActiveSubs.clear();
    inflightRequests.clear();
  } finally {
    stream.popSuppressErrorToasts();
  }
}

// ─── Datafeed factory ─────────────────────────────────────────────────────────

export interface CreateDatafeedOptions {
  exchange?: string;
}

export function createMarketDatafeed(
  options: CreateDatafeedOptions = {},
): TVDatafeed {
  const exchange = options.exchange ?? "binance";

  // For each TV subscription guid we hold cancel handles + latest forming bar.
  type ActiveSubState = ActiveSub;

  return {
    onReady(callback) {
      setTimeout(
        () =>
          callback({
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            exchanges: [
              { value: "BINANCE", name: "Binance", desc: "Binance Spot" },
            ],
            symbols_types: [{ name: "crypto", value: "crypto" }],
          }),
        0,
      );
    },

    searchSymbols(userInput, _exchange, _symbolType, onResult) {
      const q = userInput.toUpperCase().trim();

      MarketDataService.searchSymbols({
        exchange,
        query: q,
        quote: "USDT",
        limit: 100,
      })
        .then((symbols) => {
          onResult(
            symbols.map((item) => ({
              symbol: item.symbol,
              full_name: `BINANCE:${item.symbol}`,
              description: item.description,
              exchange: "BINANCE",
              ticker: item.symbol,
              type: "crypto",
            })),
          );
        })
        .catch(() => {
          const results = POPULAR_SYMBOLS.filter((s) => s.includes(q)).map(
            (s) => ({
              symbol: s,
              full_name: `BINANCE:${s}`,
              description: `${s} Spot`,
              exchange: "BINANCE",
              ticker: s,
              type: "crypto",
            }),
          );
          onResult(results);
        });
    },

    resolveSymbol(symbolName, onResolve) {
      const ticker = symbolName.replace(/^BINANCE:/, "").toUpperCase();

      setTimeout(
        () =>
          onResolve({
            ticker,
            name: ticker,
            full_name: `BINANCE:${ticker}`,
            description: `${ticker} Binance Spot`,
            type: "crypto",
            session: "24x7",
            timezone: "Etc/UTC",
            exchange: "BINANCE",
            listed_exchange: "BINANCE",
            format: "price",
            minmov: 1,
            pricescale: getPricescale(ticker),
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            supported_resolutions: SUPPORTED_RESOLUTIONS,
            volume_precision: 4,
            data_status: "streaming",
          }),
        0,
      );
    },

    /**
     * v1.15 signature: (symbolInfo, resolution, rangeStartDate, rangeEndDate, onResult, onError)
     * `rangeStartDate` / `rangeEndDate` are UNIX **seconds**.
     */
    getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate, onResult, onError) {
      if (
        !rangeStartDate ||
        !rangeEndDate ||
        !Number.isFinite(rangeStartDate) ||
        !Number.isFinite(rangeEndDate)
      ) {
        onResult([], { noData: true });
        return;
      }

      const interval = TV_TO_CANONICAL[resolution];
      if (!interval) {
        onError(`Unsupported resolution: ${resolution}`);
        return;
      }

      const symbol = symbolInfo.ticker ?? symbolInfo.name;
      const intervalMs = INTERVAL_MS[interval];
      const nowMs = Date.now();

      const tvFromMs = Math.floor(rangeStartDate) * 1000;
      const tvToMs = Math.floor(rangeEndDate) * 1000;

      if (tvToMs <= tvFromMs) {
        onResult([], { noData: true });
        return;
      }

      // 首屏 OKX 式 ~303 根 / 3 路；左拖 ~202 根 / 2 路
      const isHistoryLoad = tvToMs < nowMs - 2 * intervalMs;
      const shards = isHistoryLoad
        ? buildLazyShards(tvFromMs, tvToMs, intervalMs)
        : buildInitShards(tvToMs, intervalMs);
      if (shards.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const dedupeKey = inflightKey(symbol, resolution, tvFromMs, tvToMs);
      const requestEpoch = datafeedEpoch;

      const deliver = (merged: IKline[]) => {
        if (isStaleDatafeedRequest(requestEpoch)) {
          onResult([], { noData: true });
          return;
        }
        const filtered = filterBarsByRange(merged, tvFromMs, tvToMs);
        if (filtered.length === 0) {
          onResult([], { noData: true });
          return;
        }

        const bars: TVBar[] = filtered.map((bar) => ({
          time: bar.time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
        }));

        onResult(bars, { noData: false });
      };

      const existing = inflightRequests.get(dedupeKey);
      if (existing) {
        // TV 可能短时间重复请求同一区间，挂到已有 Promise 上
        existing.then(deliver).catch((error: unknown) => {
          if (isStaleDatafeedRequest(requestEpoch)) {
            return;
          }
          onError(error instanceof Error ? error.message : String(error));
        });
        return;
      }

      const requestId = dedupeKey;

      const task = MarketWorkerManager.getInstance()
        .fetchKlineShards({
          requestId,
          apiBaseUrl: getWorkerApiBaseUrl(),
          exchange,
          symbol,
          interval,
          shards,
          shouldIgnoreResult: () => isStaleDatafeedRequest(requestEpoch),
        })
        .then((batches) => mergeKlines(batches))
        .finally(() => {
          inflightRequests.delete(dedupeKey);
        });

      inflightRequests.set(dedupeKey, task);

      task
        .then(deliver)
        .catch((error: unknown) => {
          if (isStaleDatafeedRequest(requestEpoch)) {
            return;
          }
          onError(error instanceof Error ? error.message : String(error));
        });
    },

    subscribeBars(symbolInfo, resolution, onTick, listenerGuid) {
      const interval = TV_TO_CANONICAL[resolution];
      if (!interval) return;

      const symbol = symbolInfo.ticker ?? symbolInfo.name;
      const stream = getMarketStreamClient();

      const state: ActiveSubState = {
        cancelKline: () => {},
        cancelTrades: () => {},
        lastBar: null,
      };

      // 闭合 K 线：整根 bar 更新
      state.cancelKline = stream.subscribeKline(
        exchange,
        symbol,
        interval,
        (tick: IKlineTick) => {
          if (!globalActiveSubs.has(listenerGuid)) {
            return;
          }
          const bar: TVBar = {
            time: tick.time,
            open: tick.open,
            high: tick.high,
            low: tick.low,
            close: tick.close,
            volume: tick.volume,
          };

          state.lastBar = bar;
          onTick(bar);
        },
      );

      // aggTrade gives us smoother in-bar updates — every trade moves the
      // forming candle's close (and possibly high/low) without waiting for
      // the next kline event.
      state.cancelTrades = stream.subscribeTrades(
        exchange,
        symbol,
        (trade: ITradeTick) => {
          if (!globalActiveSubs.has(listenerGuid)) {
            return;
          }
          const last = state.lastBar;
          if (!last) return;

          // Only mutate the *current* forming bar; if the trade timestamp
          // belongs to a future bar, defer to the next kline event.
          if (trade.time < last.time || trade.time >= last.time + INTERVAL_MS[interval]) {
            return;
          }

          const updated: TVBar = {
            time: last.time,
            open: last.open,
            high: Math.max(last.high, trade.price),
            low: Math.min(last.low, trade.price),
            close: trade.price,
            volume: last.volume,
          };

          state.lastBar = updated;
          onTick(updated);
        },
      );

      globalActiveSubs.set(listenerGuid, state);
    },

    unsubscribeBars(listenerGuid) {
      const state = globalActiveSubs.get(listenerGuid);
      if (!state) return;
      state.cancelKline();
      state.cancelTrades();
      globalActiveSubs.delete(listenerGuid);
    },

    getServerTime(callback) {
      // 直接用本地时间，避免额外 round-trip 到 trading-api/Binance
      setTimeout(() => callback(Math.floor(Date.now() / 1000)), 0);
    },
  };
}

// Backwards-compatible alias for any existing imports.
export const createBinanceDatafeed = createMarketDatafeed;
