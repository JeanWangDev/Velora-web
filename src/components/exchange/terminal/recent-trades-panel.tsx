"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import type { MarketTrade } from "@/types/exchange";
import { formatPrice, formatQty, formatTime } from "@/utils/format-exchange";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import { cn } from "@/lib/cn";

export function RecentTradesPanel({
  symbol,
  trades,
}: {
  symbol: string;
  trades: MarketTrade[];
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const precision = meta?.pricePrecision ?? 2;
  const qtyPrecision = meta?.qtyPrecision ?? 4;

  return (
    <div className="flex h-full flex-col bg-[var(--terminal-bg)]">
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center border-b border-[var(--terminal-border)] px-3 py-2">
        <span className="text-xs font-semibold text-[var(--terminal-text)]">
          {t("trade.recentTrades")}
        </span>
      </div>

      {/* 列头 */}
      <div className="grid shrink-0 grid-cols-3 gap-1 px-2 py-1 text-[10px] text-[var(--terminal-muted)]">
        <span>{t("trade.price")}({meta?.quote})</span>
        <span className="text-right">{t("trade.quantity")}({meta?.base})</span>
        <span className="text-right">{t("orders.time")}</span>
      </div>

      {/* 记录列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {trades.map((tr, i) => (
          <div
            key={tr.id}
            className={cn(
              "grid grid-cols-3 gap-1 px-2 py-[3px] text-[11px] tabular-nums",
              i === 0 && "bg-[var(--terminal-panel)]",
            )}
          >
            <span className={tr.side === "buy" ? "text-up" : "text-down"}>
              {formatPrice(tr.price, precision, locale)}
            </span>
            <span className="text-right text-[var(--terminal-text)]">
              {formatQty(tr.qty, qtyPrecision)}
            </span>
            <span className="text-right text-[var(--terminal-muted)]">
              {formatTime(tr.ts, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
