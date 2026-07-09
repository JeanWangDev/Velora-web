"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useTradingStore } from "@/stores/use-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import {
  displayPair,
  formatDateTime,
  formatPrice,
  formatQty,
} from "@/utils/format-exchange";

type Tab = "open" | "history" | "trades";

export default function OrdersPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("open");
  const openOrders = useTradingStore((s) => s.openOrders);
  const orderHistory = useTradingStore((s) => s.orderHistory);
  const userTrades = useTradingStore((s) => s.userTrades);
  const cancelOrder = useTradingStore((s) => s.cancelOrder);
  const cancelAll = useTradingStore((s) => s.cancelAll);

  useEffect(() => {
    void useTradingStore.getState().hydrate();
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "open", label: t("orders.tabOpen") },
    { key: "history", label: t("orders.tabHistory") },
    { key: "trades", label: t("orders.tabTrades") },
  ];

  return (
    <div className="aurora-bg mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("orders.title")}
        </h1>
        {tab === "open" && openOrders.length > 0 && (
          <button
            type="button"
            onClick={() => void cancelAll()}
            className="text-sm text-down hover:underline"
          >
            {t("trade.cancelAll")}
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === item.key
                ? "bg-primary/15 text-primary"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-x-auto rounded-2xl">
        {tab === "open" && (
          <OrdersTable
            empty={t("orders.empty")}
            rows={openOrders}
            locale={locale}
            t={t}
            onCancel={cancelOrder}
          />
        )}
        {tab === "history" && (
          <HistoryTable
            empty={t("orders.empty")}
            rows={orderHistory}
            locale={locale}
            t={t}
          />
        )}
        {tab === "trades" && (
          <TradesTable
            empty={t("orders.empty")}
            rows={userTrades}
            locale={locale}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

function OrdersTable({
  rows,
  empty,
  locale,
  t,
  onCancel,
}: {
  rows: ReturnType<typeof useTradingStore.getState>["openOrders"];
  empty: string;
  locale: "zh" | "en";
  t: (k: string) => string;
  onCancel: (id: string) => void | Promise<void>;
}) {
  if (rows.length === 0) {
    return <EmptyState message={empty} />;
  }
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
        <tr>
          <th className="px-4 py-3 text-left">{t("orders.time")}</th>
          <th className="px-4 py-3 text-left">{t("orders.symbol")}</th>
          <th className="px-4 py-3">{t("orders.side")}</th>
          <th className="px-4 py-3">{t("orders.type")}</th>
          <th className="px-4 py-3 text-right">{t("orders.price")}</th>
          <th className="px-4 py-3 text-right">{t("orders.qty")}</th>
          <th className="px-4 py-3">{t("orders.status")}</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => {
          const meta = getSymbolMeta(o.symbol);
          return (
            <tr
              key={o.id}
              className="border-t border-border/60 hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3 text-muted">
                {formatDateTime(o.createdAt, locale)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/trade/${o.symbol}`}
                  className="font-medium hover:text-primary"
                >
                  {displayPair(o.symbol)}
                </Link>
              </td>
              <td
                className={`px-4 py-3 text-center ${o.side === "buy" ? "text-up" : "text-down"}`}
              >
                {t(`trade.${o.side}`)}
              </td>
              <td className="px-4 py-3 text-center">
                {t(`trade.${o.type}`)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {o.price
                  ? formatPrice(o.price, meta?.pricePrecision ?? 2, locale)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatQty(o.quantity, meta?.qtyPrecision ?? 4)}
              </td>
              <td className="px-4 py-3 text-center text-xs">
                {t(`orders.statusMap.${o.status}`)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onCancel(o.id)}
                  className="text-xs text-down hover:underline"
                >
                  {t("trade.cancel")}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function HistoryTable({
  rows,
  empty,
  locale,
  t,
}: {
  rows: ReturnType<typeof useTradingStore.getState>["orderHistory"];
  empty: string;
  locale: "zh" | "en";
  t: (k: string) => string;
}) {
  if (rows.length === 0) return <EmptyState message={empty} />;
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
        <tr>
          <th className="px-4 py-3 text-left">{t("orders.time")}</th>
          <th className="px-4 py-3 text-left">{t("orders.symbol")}</th>
          <th className="px-4 py-3">{t("orders.side")}</th>
          <th className="px-4 py-3 text-right">{t("orders.price")}</th>
          <th className="px-4 py-3 text-right">{t("orders.filled")}</th>
          <th className="px-4 py-3">{t("orders.status")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => {
          const meta = getSymbolMeta(o.symbol);
          return (
            <tr
              key={o.id}
              className="border-t border-border/60 hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3 text-muted">
                {formatDateTime(o.createdAt, locale)}
              </td>
              <td className="px-4 py-3">{displayPair(o.symbol)}</td>
              <td
                className={`px-4 py-3 text-center ${o.side === "buy" ? "text-up" : "text-down"}`}
              >
                {t(`trade.${o.side}`)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {o.price
                  ? formatPrice(o.price, meta?.pricePrecision ?? 2, locale)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatQty(o.filledQuantity, meta?.qtyPrecision ?? 4)} /{" "}
                {formatQty(o.quantity, meta?.qtyPrecision ?? 4)}
              </td>
              <td className="px-4 py-3 text-center text-xs">
                {t(`orders.statusMap.${o.status}`)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TradesTable({
  rows,
  empty,
  locale,
  t,
}: {
  rows: ReturnType<typeof useTradingStore.getState>["userTrades"];
  empty: string;
  locale: "zh" | "en";
  t: (k: string) => string;
}) {
  if (rows.length === 0) return <EmptyState message={empty} />;
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
        <tr>
          <th className="px-4 py-3 text-left">{t("orders.time")}</th>
          <th className="px-4 py-3 text-left">{t("orders.symbol")}</th>
          <th className="px-4 py-3">{t("orders.side")}</th>
          <th className="px-4 py-3 text-right">{t("orders.price")}</th>
          <th className="px-4 py-3 text-right">{t("orders.qty")}</th>
          <th className="px-4 py-3 text-right">{t("orders.fee")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((tr) => {
          const meta = getSymbolMeta(tr.symbol);
          return (
            <tr
              key={tr.id}
              className="border-t border-border/60 hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3 text-muted">
                {formatDateTime(tr.ts, locale)}
              </td>
              <td className="px-4 py-3">{displayPair(tr.symbol)}</td>
              <td
                className={`px-4 py-3 text-center ${tr.side === "buy" ? "text-up" : "text-down"}`}
              >
                {t(`trade.${tr.side}`)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatPrice(tr.price, meta?.pricePrecision ?? 2, locale)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {formatQty(tr.quantity, meta?.qtyPrecision ?? 4)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                {formatPrice(tr.fee, 4, locale)} {tr.feeCurrency}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-4 py-16 text-center text-sm text-muted">{message}</p>
  );
}
