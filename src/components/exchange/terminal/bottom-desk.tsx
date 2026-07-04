"use client";

import { useRef } from "react";
import Link from "next/link";
import { GripHorizontal } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { useTerminalStore, type BottomDeskTab } from "@/stores/use-terminal-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import {
  displayPair,
  formatDateTime,
  formatPrice,
  formatQty,
} from "@/utils/format-exchange";
import { cn } from "@/lib/cn";

export function BottomDesk({ symbol }: { symbol: string }) {
  const t = useExchangeT();
  const locale = useLocale();
  const tab = useTerminalStore((s) => s.bottomTab);
  const setTab = useTerminalStore((s) => s.setBottomTab);
  const height = useTerminalStore((s) => s.bottomDeskHeight);
  const setHeight = useTerminalStore((s) => s.setBottomDeskHeight);
  const openOrders = useMockTradingStore((s) => s.openOrders);
  const orderHistory = useMockTradingStore((s) => s.orderHistory);
  const userTrades = useMockTradingStore((s) => s.userTrades);
  const balances = useMockTradingStore((s) => s.balances);
  const cancelOrder = useMockTradingStore((s) => s.cancelOrder);
  const cancelAll = useMockTradingStore((s) => s.cancelAll);
  const dragRef = useRef<{ y: number; h: number } | null>(null);

  const tabs: { key: BottomDeskTab; label: string; count?: number }[] = [
    {
      key: "open",
      label: t("trade.openOrders"),
      count: openOrders.filter((o) => o.symbol === symbol).length,
    },
    { key: "history", label: t("trade.orderHistory") },
    { key: "trades", label: t("trade.tradeHistory") },
    { key: "assets", label: t("assets.title") },
  ];

  const symbolOpen = openOrders.filter((o) => o.symbol === symbol);
  const symbolHistory = orderHistory.filter((o) => o.symbol === symbol);
  const symbolTrades = userTrades.filter((tr) => tr.symbol === symbol);

  const onResizeStart = (e: React.PointerEvent) => {
    dragRef.current = { y: e.clientY, h: height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onResizeMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.y - e.clientY;
    setHeight(dragRef.current.h + dy);
  };

  const onResizeEnd = () => {
    dragRef.current = null;
  };

  return (
    <section
      className="terminal-panel flex shrink-0 flex-col border-t border-[var(--terminal-border)] bg-[var(--terminal-panel)]"
      style={{ height }}
    >
      <div
        className="flex cursor-row-resize items-center justify-center border-b border-[var(--terminal-border)] py-0.5 text-muted hover:text-foreground"
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
      >
        <GripHorizontal className="h-4 w-4" />
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[var(--terminal-border)] px-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-xs font-medium transition",
                tab === item.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
              {item.count != null && item.count > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[10px]">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === "open" && symbolOpen.length > 0 && (
          <button
            type="button"
            onClick={() => cancelAll(symbol)}
            className="shrink-0 px-2 py-1 text-xs text-down hover:underline"
          >
            {t("trade.cancelAll")}
          </button>
        )}
        <Link
          href="/orders"
          className="shrink-0 px-2 py-1 text-xs text-primary hover:underline"
        >
          {t("orders.title")} →
        </Link>
      </div>

      <div className="terminal-scroll min-h-0 flex-1 overflow-auto">
        {tab === "open" && (
          <DeskTable
            empty={t("orders.empty")}
            headers={[
              t("orders.time"),
              t("orders.side"),
              t("orders.type"),
              t("orders.price"),
              t("orders.qty"),
              t("orders.status"),
              "",
            ]}
            rows={symbolOpen.map((o) => {
              const meta = getSymbolMeta(o.symbol);
              return [
                formatDateTime(o.createdAt, locale),
                <span key="s" className={o.side === "buy" ? "text-up" : "text-down"}>
                  {t(`trade.${o.side}`)}
                </span>,
                t(`trade.${o.type}`),
                o.price
                  ? formatPrice(o.price, meta?.pricePrecision ?? 2, locale)
                  : "—",
                formatQty(o.quantity, meta?.qtyPrecision ?? 4),
                t(`orders.statusMap.${o.status}`),
                <button
                  key="c"
                  type="button"
                  onClick={() => cancelOrder(o.id)}
                  className="text-down hover:underline"
                >
                  {t("trade.cancel")}
                </button>,
              ];
            })}
          />
        )}
        {tab === "history" && (
          <DeskTable
            empty={t("orders.empty")}
            headers={[
              t("orders.time"),
              t("orders.side"),
              t("orders.price"),
              t("orders.filled"),
              t("orders.status"),
            ]}
            rows={symbolHistory.map((o) => {
              const meta = getSymbolMeta(o.symbol);
              return [
                formatDateTime(o.createdAt, locale),
                <span key="s" className={o.side === "buy" ? "text-up" : "text-down"}>
                  {t(`trade.${o.side}`)}
                </span>,
                o.price
                  ? formatPrice(o.price, meta?.pricePrecision ?? 2, locale)
                  : "—",
                `${formatQty(o.filledQuantity, meta?.qtyPrecision ?? 4)} / ${formatQty(o.quantity, meta?.qtyPrecision ?? 4)}`,
                t(`orders.statusMap.${o.status}`),
              ];
            })}
          />
        )}
        {tab === "trades" && (
          <DeskTable
            empty={t("orders.empty")}
            headers={[
              t("orders.time"),
              t("orders.side"),
              t("orders.price"),
              t("orders.qty"),
              t("orders.fee"),
            ]}
            rows={symbolTrades.map((tr) => {
              const meta = getSymbolMeta(tr.symbol);
              return [
                formatDateTime(tr.ts, locale),
                <span key="s" className={tr.side === "buy" ? "text-up" : "text-down"}>
                  {t(`trade.${tr.side}`)}
                </span>,
                formatPrice(tr.price, meta?.pricePrecision ?? 2, locale),
                formatQty(tr.quantity, meta?.qtyPrecision ?? 4),
                `${formatPrice(tr.fee, 4, locale)} ${tr.feeCurrency}`,
              ];
            })}
          />
        )}
        {tab === "assets" && (
          <DeskTable
            empty={t("common.noData")}
            headers={[
              t("assets.currency"),
              t("assets.available"),
              t("assets.frozen"),
              t("assets.totalCol"),
            ]}
            rows={balances.map((b) => [
              b.currency,
              formatPrice(b.available, 8, locale),
              formatPrice(b.frozen, 8, locale),
              formatPrice(b.available + b.frozen, 8, locale),
            ])}
          />
        )}
      </div>
    </section>
  );
}

function DeskTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-muted">{empty}</p>
    );
  }
  return (
    <table className="w-full min-w-[640px] text-xs">
      <thead className="sticky top-0 bg-[var(--terminal-panel-2)] text-muted">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2 text-left font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className="border-t border-[var(--terminal-border)] hover:bg-[var(--terminal-panel-2)]/60"
          >
            {row.map((cell, ci) => (
              <td key={ci} className="px-3 py-2 font-mono tabular-nums">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
