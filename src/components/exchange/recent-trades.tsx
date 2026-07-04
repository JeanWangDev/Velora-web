"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import type { MarketTrade } from "@/types/exchange";
import { formatPrice, formatQty, formatTime } from "@/utils/format-exchange";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { cn } from "@/lib/cn";

export function RecentTradesView({
  symbol,
  trades,
  compact = false,
  scroll = false,
}: {
  symbol: string;
  trades: MarketTrade[];
  compact?: boolean;
  scroll?: boolean;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const precision = meta?.pricePrecision ?? 2;
  const qtyPrecision = meta?.qtyPrecision ?? 4;

  return (
    <div>
      <div className="mb-1 grid grid-cols-3 gap-1 px-2 text-[10px] text-muted">
        <span>
          {t("trade.price")} ({meta?.quote})
        </span>
        <span className="text-right">
          {t("trade.quantity")} ({meta?.base})
        </span>
        <span className="text-right">{t("orders.time")}</span>
      </div>
      <div className={scroll ? "" : compact ? "max-h-28 overflow-y-auto" : "max-h-64 overflow-y-auto"}>
        {trades.map((tr, i) => (
          <div
            key={tr.id}
            className={cn(
              "grid grid-cols-3 gap-1 px-2 py-[2px] text-[11px] tabular-nums",
              i === 0 && "bg-[#141414]",
            )}
          >
            <span
              className={tr.side === "buy" ? "text-up" : "text-down"}
            >
              {formatPrice(tr.price, precision, locale)}
            </span>
            <span className="text-right">{formatQty(tr.qty, qtyPrecision)}</span>
            <span className="text-right text-muted">
              {formatTime(tr.ts, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
