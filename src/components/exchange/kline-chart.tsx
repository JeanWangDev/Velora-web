"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { buildKlines } from "@/mocks/exchange-data";
import type { KlineBar } from "@/types/exchange";

export const KLINE_INTERVALS = [
  { label: "1m", minutes: 1 },
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "1h", minutes: 60 },
  { label: "4h", minutes: 240 },
  { label: "1D", minutes: 1440 },
];

export function KlineChart({
  symbol,
  intervalMinutes,
  lastPrice,
}: {
  symbol: string;
  intervalMinutes: number;
  lastPrice: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const barsRef = useRef<KlineBar[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0e14" },
        textColor: "#6b7280",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(30,36,48,0.65)" },
        horzLines: { color: "rgba(30,36,48,0.65)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00d2aa",
      downColor: "#ff6b8a",
      borderVisible: false,
      wickUpColor: "#00d2aa",
      wickDownColor: "#ff6b8a",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const bars = buildKlines(symbol, intervalMinutes);
    barsRef.current = bars;
    seriesRef.current?.setData(
      bars.map((b) => ({
        time: Math.floor(b.time / 1000) as never,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [symbol, intervalMinutes]);

  useEffect(() => {
    const bars = barsRef.current;
    if (!bars.length || !seriesRef.current) return;
    const last = bars[bars.length - 1];
    const updated = {
      ...last,
      close: lastPrice,
      high: Math.max(last.high, lastPrice),
      low: Math.min(last.low, lastPrice),
    };
    barsRef.current[bars.length - 1] = updated;
    seriesRef.current.update({
      time: Math.floor(updated.time / 1000) as never,
      open: updated.open,
      high: updated.high,
      low: updated.low,
      close: updated.close,
    });
  }, [lastPrice]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[280px]" />
  );
}
