"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import type { OrderBook } from "@/types/exchange";
import { formatPrice, formatQty } from "@/utils/format-exchange";
import { getSymbolMeta } from "@/mocks/exchange-data";

interface OrderBookViewProps {
  symbol: string;
  book: OrderBook;
  compact?: boolean;
  maxLevels?: number;
  onPriceClick?: (price: number) => void;
}

export function OrderBookView({
  symbol,
  book,
  compact = false,
  maxLevels = 20,
  onPriceClick,
}: OrderBookViewProps) {
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

  const row = (price: number, qty: number, side: "ask" | "bid") => {
    const width = `${Math.min(100, (qty / maxQty) * 100)}%`;
    return (
      <button
        key={`${side}-${price}`}
        type="button"
        onClick={() => onPriceClick?.(price)}
        className="relative grid w-full grid-cols-2 gap-2 px-2 py-0.5 text-left text-xs hover:bg-surface-muted/80"
      >
        <span
          className={`absolute inset-y-0 ${side === "bid" ? "left-0 depth-bar-bid" : "right-0 depth-bar-ask"}`}
          style={{ width }}
        />
        <span
          className={`relative tabular-nums ${side === "bid" ? "text-up" : "text-down"}`}
        >
          {formatPrice(price, precision, locale)}
        </span>
        <span className="relative text-right tabular-nums text-muted">
          {formatQty(qty, qtyPrecision)}
        </span>
      </button>
    );
  };

  return (
    <div className={compact ? "text-xs" : ""}>
      {!compact && (
        <div className="mb-2 grid grid-cols-2 gap-2 px-2 text-xs text-muted">
          <span>{t("trade.price")}</span>
          <span className="text-right">{t("trade.quantity")}</span>
        </div>
      )}
      <div className="space-y-0">{asks.map((l) => row(l.price, l.qty, "ask"))}</div>
      <div className="my-1 border-y border-border py-1 text-center text-[10px] text-muted">
        {t("trade.orderBook")}
      </div>
      <div className="space-y-0">{bids.map((l) => row(l.price, l.qty, "bid"))}</div>
    </div>
  );
}
