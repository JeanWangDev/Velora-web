"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { displayPair, formatDateTime, formatPrice } from "@/utils/format-exchange";

export function TradeHistoryPanel({ symbol }: { symbol?: string }) {
  const t = useExchangeT();
  const locale = useLocale();
  const userTrades = useMockTradingStore((s) => s.userTrades);
  const rows = userTrades.filter((tr) => !symbol || tr.symbol === symbol);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">{t("orders.empty")}</p>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead className="text-muted">
        <tr>
          <th className="py-1 text-left">{t("orders.time")}</th>
          <th className="py-1">{t("orders.symbol")}</th>
          <th className="py-1 text-right">{t("orders.price")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((tr) => {
          const meta = getSymbolMeta(tr.symbol);
          return (
            <tr key={tr.id} className="border-t border-border/60">
              <td className="py-2 text-muted">
                {formatDateTime(tr.ts, locale)}
              </td>
              <td className="text-center">{displayPair(tr.symbol)}</td>
              <td className="text-right tabular-nums">
                {formatPrice(tr.price, meta?.pricePrecision ?? 2, locale)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
