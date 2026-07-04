/**
 * 主线程侧行情 Worker 门面：把 K 线分片请求 post 到 Worker，在 Worker 内用 axios 拉 trading-api。
 * trade/datafeed 的 getBars 通过本类并发 3/2 段，避免主线程阻塞与重复 toast 逻辑分散。
 */
import { BaseWorker } from "./base-worker";
import type { IMessagePayload } from "./message-payload";
import { WORKER_EVENT } from "./worker-event";
import { WorkerMessageChannelEnum } from "./worker-message-channel";
import { toast } from "@/services/toast";
import type { CanonicalInterval, IKline } from "@/types/market";

/** 单段历史 K 线的时间窗与 limit（与 datafeed buildBarShards 产出一致） */
export interface KlineShardRange {
  startTime: number;
  endTime: number;
  limit: number;
}

export interface FetchKlineShardsParams {
  requestId: string;
  apiBaseUrl: string;
  exchange: string;
  symbol: string;
  interval: CanonicalInterval;
  shards: KlineShardRange[];
  /** 为 true 时不 toast（例如页面已离开或 datafeed 已 reset） */
  shouldIgnoreResult?: () => boolean;
}

interface WorkerKlinesResult {
  requestId: string;
  batches: IKline[][];
  error: string | null;
}

export class MarketWorkerManager extends BaseWorker {
  private static instance: MarketWorkerManager;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new MarketWorkerManager();
    }
    return this.instance;
  }

  private constructor() {
    super();
  }

  /**
   * 并发拉取多段 K 线；requestId 与 datafeed 的 dedupeKey 对齐，用于忽略其它请求的回调。
   * 错误在主线程 toast（Worker 内无 document，不能走 apiClient 的 UI toast）。
   */
  public fetchKlineShards(params: FetchKlineShardsParams): Promise<IKline[][]> {
    return new Promise((resolve, reject) => {
      const handler = (message: IMessagePayload<WorkerKlinesResult>) => {
        // Worker 可能广播多种 channel，只处理本次 K 线任务
        if (message.channel !== WorkerMessageChannelEnum.MARKET_KLINES) {
          return;
        }

        const result = message.payload;
        // 同一时刻可能有多个 getBars，用 requestId 匹配本次 Promise
        if (!result || result.requestId !== params.requestId) {
          return;
        }

        this.off(WORKER_EVENT, handler);

        if (result.error) {
          if (!params.shouldIgnoreResult?.()) {
            toast.error(result.error);
          }
          reject(new Error(result.error));
          return;
        }

        // batches 与 shards 顺序一致，由 datafeed mergeKlines 按 time 去重合并
        resolve(result.batches);
      };

      this.on(WORKER_EVENT, handler);

      this.postMessage({
        channel: WorkerMessageChannelEnum.MARKET_KLINES,
        payload: params,
      });
    });
  }
}
