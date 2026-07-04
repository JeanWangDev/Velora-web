/**
 * 自研 K 线模块（lightweight-charts）类型，供 `_components/kline/*` 使用。
 * 当前交易页主图使用 TV；本目录为预留/后续自定义图表场景。
 */
import type { UTCTimestamp } from "lightweight-charts";

export type KlineInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

export const KLINE_INTERVALS: { label: string; value: KlineInterval }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];

export interface KlineCandle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface KlineLivePayload extends KlineCandle {
  isClosed: boolean;
}

export type BinanceKlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export interface BinanceWsKlineMessage {
  e: "kline";
  E: number;
  s: string;
  k: {
    t: number;
    T: number;
    s: string;
    i: string;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    x: boolean;
  };
}
