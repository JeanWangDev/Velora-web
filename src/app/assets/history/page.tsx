"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useTradingStore } from "@/stores/use-trading-store";
import { formatDateTime, formatPrice } from "@/utils/format-exchange";

export default function AssetsHistoryPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const ledger = useTradingStore((s) => s.ledger);

  useEffect(() => {
    void useTradingStore.getState().hydrate();
  }, []);

  return (
    <div className="aurora-bg mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/assets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("assets.historyTitle")}
      </h1>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("assets.time")}</th>
              <th className="px-4 py-3 text-left">{t("assets.currency")}</th>
              <th className="px-4 py-3 text-left">{t("assets.type")}</th>
              <th className="px-4 py-3 text-right">{t("assets.amount")}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">
                {t("assets.ref")}
              </th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              ledger.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-border/60 transition hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(e.ts, locale)}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.currency}</td>
                  <td className="px-4 py-3">
                    {t(`assets.types.${e.type}`)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      e.amount >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {e.amount >= 0 ? "+" : ""}
                    {formatPrice(e.amount, 8, locale)}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted sm:table-cell">
                    {e.refId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
