"use client";

import { useState } from "react";
import { BarChart3, Maximize2 } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { KlineChart, KLINE_INTERVALS } from "@/components/exchange/kline-chart";
import { cn } from "@/lib/cn";

export function ChartPanel({
  symbol,
  lastPrice,
}: {
  symbol: string;
  lastPrice: number;
}) {
  const t = useExchangeT();
  const [interval, setInterval] = useState(15);

  return (
    <div className="terminal-panel flex min-h-0 flex-col overflow-hidden border-0">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--terminal-border)] px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {KLINE_INTERVALS.map((iv) => (
            <button
              key={iv.label}
              type="button"
              onClick={() => setInterval(iv.minutes)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition",
                iv.minutes === interval
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:bg-[var(--terminal-panel-2)] hover:text-foreground",
              )}
            >
              {iv.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-muted">
          <button
            type="button"
            className="rounded p-1.5 hover:bg-[var(--terminal-panel-2)] hover:text-foreground"
            title={t("trade.interval")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 hover:bg-[var(--terminal-panel-2)] hover:text-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <KlineChart
          symbol={symbol}
          intervalMinutes={interval}
          lastPrice={lastPrice}
        />
      </div>
    </div>
  );
}
