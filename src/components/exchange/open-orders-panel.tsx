"use client";

import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { displayPair, formatPrice } from "@/utils/format-exchange";

export function OpenOrdersPanel({ symbol }: { symbol?: string }) {
  const t = useExchangeT();
  const locale = useLocale();
  const openOrders = useMockTradingStore((s) => s.openOrders);
  const cancelOrder = useMockTradingStore((s) => s.cancelOrder);
  const cancelAll = useMockTradingStore((s) => s.cancelAll);

  const rows = openOrders.filter((o) => !symbol || o.symbol === symbol);

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <button
          type="button"
          onClick={() => cancelAll(symbol)}
          className="text-xs text-down hover:underline"
        >
          {t("trade.cancelAll")}
        </button>
      )}
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{t("orders.empty")}</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-1 text-left">{t("orders.symbol")}</th>
              <th className="py-1">{t("orders.side")}</th>
              <th className="py-1 text-right">{t("orders.price")}</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const meta = getSymbolMeta(o.symbol);
              return (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="py-2">{displayPair(o.symbol)}</td>
                  <td
                    className={`text-center ${o.side === "buy" ? "text-up" : "text-down"}`}
                  >
                    {t(`trade.${o.side}`)}
                  </td>
                  <td className="text-right tabular-nums">
                    {o.price
                      ? formatPrice(o.price, meta?.pricePrecision ?? 2, locale)
                      : "—"}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => cancelOrder(o.id)}
                      className="text-down hover:underline"
                    >
                      {t("trade.cancel")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
