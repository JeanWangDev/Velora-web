/** 自研 K 线用简单移动平均线，输入 `_types/kline` 的 KlineCandle */
import type { UTCTimestamp } from "lightweight-charts";
import type { KlineCandle } from "@/app/trade/_types/kline";

export interface SmaPoint {
  time: UTCTimestamp;
  value: number;
}

export function computeSMA(candles: KlineCandle[], period: number): SmaPoint[] {
  if (period <= 0 || candles.length < period) {
    return [];
  }

  const result: SmaPoint[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;

    if (i >= period) {
      sum -= candles[i - period].close;
    }

    if (i >= period - 1) {
      result.push({
        time: candles[i].time,
        value: sum / period,
      });
    }
  }

  return result;
}
