import { EventsService } from "@/app/news/_services/events-service";
import { MarketDataService } from "@/services/market-data-service";
import type { TVWidgetInstance } from "@/types/charting-library";
import { baseFromTradingPair } from "@/utils/symbol";

type ChartMarkApi = {
  createShape?: (
    point: { time: number; price?: number },
    options: { shape?: string; text?: string },
  ) => string | null;
  removeEntity?: (id: string) => void;
};

let eventShapeEntityIds: string[] = [];

function clearEventMarkerShapes(chart: ChartMarkApi | null) {
  if (!chart?.removeEntity) {
    eventShapeEntityIds = [];
    return;
  }

  for (const id of eventShapeEntityIds) {
    try {
      chart.removeEntity(id);
    } catch {
      /* noop */
    }
  }

  eventShapeEntityIds = [];
}

function chartApi(widget: TVWidgetInstance): ChartMarkApi | null {
  try {
    const w = widget as unknown as { chart?: () => ChartMarkApi };
    return w.chart?.() ?? null;
  } catch {
    return null;
  }
}

function nearestClose(
  bars: Array<{ time: number; close: number }>,
  publishedAt: number,
): number | undefined {
  if (bars.length === 0) return undefined;
  let best = bars[0];
  for (const bar of bars) {
    if (Math.abs(bar.time - publishedAt) < Math.abs(best.time - publishedAt)) {
      best = bar;
    }
  }
  return best.close;
}

export async function applyChartEventMarkers(
  widget: TVWidgetInstance,
  tradingPair: string,
  signal?: AbortSignal,
): Promise<void> {
  const base = baseFromTradingPair(tradingPair);
  const to = Date.now();
  const from = to - 7 * 86_400_000;

  let events: Awaited<ReturnType<typeof EventsService.chart>>["data"] = [];
  try {
    const res = await EventsService.chart({ symbol: base, from, to, limit: 40 });
    if (signal?.aborted) return;
    events = res.data;
  } catch {
    return;
  }

  const chart = chartApi(widget);
  if (!chart?.createShape || signal?.aborted) return;

  let priceByTime = new Map<number, number>();
  try {
    const bars = await MarketDataService.getKlines({
      symbol: tradingPair,
      interval: "1h",
      startTime: from,
      endTime: to,
      limit: 500,
    });
    if (signal?.aborted) return;
    priceByTime = new Map(bars.map((b) => [b.time, b.close]));
  } catch {
    // 无 K 线时仍尝试仅 time 打点
  }

  if (signal?.aborted) return;

  clearEventMarkerShapes(chart);

  for (const ev of events) {
    if (signal?.aborted) return;
    const timeSec = Math.floor(ev.publishedAt / 1000);
    const shape =
      ev.sentiment === "bullish"
        ? "arrow_up"
        : ev.sentiment === "bearish"
          ? "arrow_down"
          : "flag";

    const closeFromMap = priceByTime.get(ev.publishedAt);
    const price =
      closeFromMap ??
      nearestClose(
        [...priceByTime.entries()].map(([time, close]) => ({ time, close })),
        ev.publishedAt,
      );

    try {
      const id = chart.createShape?.(
        price !== undefined ? { time: timeSec, price } : { time: timeSec },
        { shape, text: ev.title.slice(0, 36) },
      );
      if (id) {
        eventShapeEntityIds.push(id);
      }
    } catch {
      // 单条失败不影响其余
    }
  }
}
