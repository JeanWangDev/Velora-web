import { apiClient } from "./api-client";
import type { MarketBrief } from "@/app/trade/_types/market-brief";
import type {
  CanonicalInterval,
  IExchangeMeta,
  IKline,
  ISymbolInfo,
  ISymbolSummary,
  ITicker24h,
} from "@/types/market";

const BASE = "/api/v1/market";

const DEFAULT_EXCHANGE = "binance";

export interface FetchKlinesParams {
  exchange?: string;
  symbol: string;
  interval: CanonicalInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface FetchSymbolsParams {
  exchange?: string;
  query?: string;
  limit?: number;
}

export class MarketDataService {
  /** Lightweight list of every adapter the backend has registered. */
  static listExchanges() {
    return apiClient.sendRequest<IExchangeMeta[]>({
      url: `${BASE}/exchanges`,
      method: "GET",
    });
  }

  static getServerTime(exchange: string = DEFAULT_EXCHANGE) {
    return apiClient.sendRequest<{ exchange: string; serverTime: number }>({
      url: `${BASE}/time`,
      method: "GET",
      params: { exchange },
    });
  }

  static getKlines(params: FetchKlinesParams) {
    return apiClient.sendRequest<IKline[]>({
      url: `${BASE}/klines`,
      method: "GET",
      params: {
        exchange: params.exchange ?? DEFAULT_EXCHANGE,
        symbol: params.symbol,
        interval: params.interval,
        startTime: params.startTime,
        endTime: params.endTime,
        limit: params.limit,
      },
    });
  }

  static searchSymbols(params: FetchSymbolsParams) {
    return apiClient.sendRequest<ISymbolSummary[]>({
      url: `${BASE}/symbols`,
      method: "GET",
      params: {
        exchange: params.exchange ?? DEFAULT_EXCHANGE,
        query: params.query ?? "",
        limit: params.limit,
      },
    });
  }

  static getSymbolInfo(symbol: string, exchange: string = DEFAULT_EXCHANGE) {
    return apiClient.sendRequest<ISymbolInfo>({
      url: `${BASE}/symbol-info`,
      method: "GET",
      params: { exchange, symbol },
    });
  }

  static getTicker24h(symbol: string, exchange: string = DEFAULT_EXCHANGE) {
    return apiClient.sendRequest<ITicker24h>({
      url: `${BASE}/ticker`,
      method: "GET",
      params: { exchange, symbol },
    });
  }

  static getMarketBrief(params: {
    exchange?: string;
    symbol: string;
    interval: CanonicalInterval;
  }) {
    return apiClient.sendRequest<MarketBrief>({
      url: `${BASE}/brief`,
      method: "GET",
      params: {
        exchange: params.exchange ?? DEFAULT_EXCHANGE,
        symbol: params.symbol,
        interval: params.interval,
      },
      skipAuth: true,
    });
  }

  static getPriceLevels(params: {
    exchange?: string;
    symbol: string;
    interval: CanonicalInterval;
    limit?: number;
  }) {
    return apiClient.sendRequest<{
      symbol: string;
      interval: string;
      price: number;
      supports: number[];
      resistances: number[];
    }>({
      url: `${BASE}/price-levels`,
      method: "GET",
      params: {
        exchange: params.exchange ?? DEFAULT_EXCHANGE,
        symbol: params.symbol,
        interval: params.interval,
        limit: params.limit ?? 3,
      },
      skipAuth: true,
    });
  }
}
