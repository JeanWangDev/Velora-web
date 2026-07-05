"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import type { OrderBook } from "@/types/exchange";
import { formatPrice, formatQty } from "@/utils/format-exchange";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { cn } from "@/lib/cn";

interface DepthBookProps {
  symbol: string;
  book: OrderBook;
  lastPrice: number;
  maxLevels?: number;
  onPriceClick?: (price: number) => void;
}

export function DepthBook({
  symbol,
  book,
  lastPrice,
  maxLevels = 14,
  onPriceClick,
}: DepthBookProps) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const precision = meta?.pricePrecision ?? 2;
  const qtyPrecision = meta?.qtyPrecision ?? 4;
  const asks = [...book.asks].slice(0, maxLevels).reverse();
  const bids = book.bids.slice(0, maxLevels);
  const maxQty = Math.max(
    ...asks.map((l) => l.qty),
    ...bids.map((l) => l.qty),
    0.0001,
  );

  const row = (
    price: number,
    qty: number,
    side: "ask" | "bid",
    total: number,
  ) => {
    const width = `${Math.min(100, (qty / maxQty) * 100)}%`;
    return (
      <button
        key={`${side}-${price}`}
        type="button"
        onClick={() => onPriceClick?.(price)}
        className="relative grid w-full grid-cols-3 gap-1 px-2 py-[3px] text-left text-[11px] hover:bg-[var(--terminal-panel-2)]"
      >
        <span
          className={cn(
            "absolute inset-y-0",
            side === "bid" ? "left-0 depth-bar-bid" : "right-0 depth-bar-ask",
          )}
          style={{ width }}
        />
        <span
          className={cn(
            "relative font-mono tabular-nums",
            side === "bid" ? "text-up" : "text-down",
          )}
        >
          {formatPrice(price, precision, locale)}
        </span>
        <span className="relative text-right font-mono tabular-nums text-foreground/90">
          {formatQty(qty, qtyPrecision)}
        </span>
        <span className="relative text-right font-mono tabular-nums text-muted">
          {formatQty(total, qtyPrecision)}
        </span>
      </button>
    );
  };

  const askRows = asks.reduce<{ total: number; nodes: ReturnType<typeof row>[] }>(
    (acc, l) => {
      acc.total += l.qty;
      acc.nodes.push(row(l.price, l.qty, "ask", acc.total));
      return acc;
    },
    { total: 0, nodes: [] },
  ).nodes;

  const bidRows = bids.reduce<{ total: number; nodes: ReturnType<typeof row>[] }>(
    (acc, l) => {
      acc.total += l.qty;
      acc.nodes.push(row(l.price, l.qty, "bid", acc.total));
      return acc;
    },
    { total: 0, nodes: [] },
  ).nodes;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-3 gap-1 px-2 py-1.5 text-[10px] text-muted">
        <span>{t("trade.price")}</span>
        <span className="text-right">{t("trade.quantity")}</span>
        <span className="text-right">{locale === "zh" ? "累计" : "Total"}</span>
      </div>
      <div className="terminal-scroll min-h-0 flex-1 overflow-y-auto">
        <div>{askRows}</div>
        <div className="sticky z-10 border-y border-[var(--terminal-border)] bg-[var(--terminal-panel-2)] py-1.5 text-center">
          <span className="font-mono text-sm font-semibold tabular-nums text-up">
            {formatPrice(lastPrice, precision, locale)}
          </span>
        </div>
        <div>{bidRows}</div>
      </div>
    </div>
  );
}
