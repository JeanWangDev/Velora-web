import { postMessageToMain } from "../post-message-to-main";
import type { IMessagePayload } from "../message-payload";
import { WorkerMessageChannelEnum } from "../worker-message-channel";
import { workerGet } from "@/services/worker-api-client";
import { ApiClientError } from "@/services/api-client-error";

interface ShardRange {
  startTime: number;
  endTime: number;
  limit: number;
}

interface MarketKlinesPayload {
  requestId: string;
  apiBaseUrl: string;
  exchange: string;
  symbol: string;
  interval: string;
  shards: ShardRange[];
}

interface KlineRow {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const MAX_CONCURRENT = 3;

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function runOne(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }

  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, runOne));
  return results;
}

async function fetchShard(
  apiBaseUrl: string,
  exchange: string,
  symbol: string,
  interval: string,
  shard: ShardRange,
): Promise<KlineRow[]> {
  return workerGet<KlineRow[]>({
    apiBaseUrl,
    url: "/api/v1/market/klines",
    params: {
      exchange,
      symbol,
      interval,
      startTime: String(shard.startTime),
      endTime: String(shard.endTime),
      limit: String(shard.limit),
    },
  });
}

function resolveWorkerError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}

export default async function marketKlinesHandler(message: IMessagePayload) {
  const { id, payload } = message;
  if (!payload) return;

  const params = payload as MarketKlinesPayload;

  try {
    const batches = await runWithConcurrency(
      params.shards,
      MAX_CONCURRENT,
      (shard) =>
        fetchShard(
          params.apiBaseUrl,
          params.exchange,
          params.symbol,
          params.interval,
          shard,
        ),
    );

    postMessageToMain({
      channel: WorkerMessageChannelEnum.MARKET_KLINES,
      id,
      payload: {
        requestId: params.requestId,
        batches,
        error: null,
      },
    });
  } catch (error) {
    postMessageToMain({
      channel: WorkerMessageChannelEnum.MARKET_KLINES,
      id,
      payload: {
        requestId: params.requestId,
        batches: [] as KlineRow[][],
        error: resolveWorkerError(error),
      },
    });
  }
}
