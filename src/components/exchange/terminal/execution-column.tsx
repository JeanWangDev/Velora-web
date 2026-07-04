"use client";

import { useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useTerminalStore } from "@/stores/use-terminal-store";
import type { MarketTrade, OrderBook } from "@/types/exchange";
import { DepthBook } from "@/components/exchange/terminal/depth-book";
import { RecentTradesView } from "@/components/exchange/recent-trades";
import { OrderForm } from "@/components/exchange/order-form";
import { cn } from "@/lib/cn";

export function ExecutionColumn({
  symbol,
  lastPrice,
  book,
  trades,
}: {
  symbol: string;
  lastPrice: number;
  book: OrderBook;
  trades: MarketTrade[];
}) {
  const t = useExchangeT();
  const tab = useTerminalStore((s) => s.executionTab);
  const setTab = useTerminalStore((s) => s.setExecutionTab);
  const [fillPrice, setFillPrice] = useState<number | null>(null);

  return (
    <aside className="flex min-h-0 w-[292px] shrink-0 flex-col border-l border-[var(--terminal-border)] bg-[var(--terminal-panel)]">
      <div className="flex shrink-0 border-b border-[var(--terminal-border)]">
        {(
          [
            ["depth", t("trade.orderBook")],
            ["trades", t("trade.recentTrades")],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium",
              tab === k
                ? "border-b-2 border-accent text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="terminal-scroll min-h-0 flex-[3] overflow-hidden">
        {tab === "depth" ? (
          <DepthBook
            symbol={symbol}
            book={book}
            lastPrice={lastPrice}
            maxLevels={12}
            onPriceClick={(p) => setFillPrice(p)}
          />
        ) : (
          <div className="h-full overflow-y-auto p-2">
            <RecentTradesView symbol={symbol} trades={trades} />
          </div>
        )}
      </div>

      <div className="flex-[2] shrink-0 overflow-y-auto border-t border-[var(--terminal-border)] bg-[var(--terminal-panel-2)]">
        <OrderForm
          symbol={symbol}
          lastPrice={lastPrice}
          fillPrice={fillPrice}
          onFillPriceConsumed={() => setFillPrice(null)}
          variant="terminal"
        />
      </div>
    </aside>
  );
}
