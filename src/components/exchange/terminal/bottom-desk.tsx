"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Inbox,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useTradingStore } from "@/stores/use-trading-store";
import { useTerminalStore, type BottomDeskTab } from "@/stores/use-terminal-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import {
  formatDateTime,
  formatPrice,
  formatQty,
} from "@/utils/format-exchange";
import { cn } from "@/lib/cn";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";

type HistorySubTab =
  | "limitMarket"
  | "advancedLimit"
  | "tpsl"
  | "trailingTpsl"
  | "trigger";

export function BottomDesk({ symbol }: { symbol: string }) {
  const t = useExchangeT();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const [loginOpen, setLoginOpen] = useState(false);
  const tab = useTerminalStore((s) => s.bottomTab);
  const setTab = useTerminalStore((s) => s.setBottomTab);
  const height = useTerminalStore((s) => s.bottomDeskHeight);
  const openOrders = useTradingStore((s) => s.openOrders);
  const orderHistory = useTradingStore((s) => s.orderHistory);
  const userTrades = useTradingStore((s) => s.userTrades);
  const balances = useTradingStore((s) => s.balances);
  const cancelOrder = useTradingStore((s) => s.cancelOrder);
  const cancelAll = useTradingStore((s) => s.cancelAll);

  const [historySubTab, setHistorySubTab] = useState<HistorySubTab>("limitMarket");
  const [currentSymbolOnly, setCurrentSymbolOnly] = useState(true);
  const [hideCancelled, setHideCancelled] = useState(false);

  const symbolOpen = openOrders.filter((o) => o.symbol === symbol);
  const symbolHistory = useMemo(() => {
    let rows = orderHistory;
    if (currentSymbolOnly) rows = rows.filter((o) => o.symbol === symbol);
    if (hideCancelled) rows = rows.filter((o) => o.status !== "cancelled");
    if (historySubTab === "limitMarket") {
      rows = rows.filter((o) => o.type === "limit" || o.type === "market");
    }
    return rows;
  }, [orderHistory, symbol, currentSymbolOnly, hideCancelled, historySubTab]);

  const symbolTrades = userTrades.filter((tr) => tr.symbol === symbol);
  const openCount = openOrders.filter((o) => o.symbol === symbol).length;

  const tabs: { key: BottomDeskTab; label: string; count?: number }[] = [
    { key: "open", label: t("trade.openOrders"), count: openCount },
    { key: "history", label: t("trade.orderHistory") },
    { key: "trades", label: t("trade.tradeHistory") },
    { key: "assets", label: t("assets.title") },
  ];

  const historySubTabs: { key: HistorySubTab; label: string }[] = [
    { key: "limitMarket", label: t("trade.historySubLimitMarket") },
    { key: "advancedLimit", label: t("trade.historySubAdvancedLimit") },
    { key: "tpsl", label: t("trade.historySubTpsl") },
    { key: "trailingTpsl", label: t("trade.historySubTrailingTpsl") },
    { key: "trigger", label: t("trade.historySubTrigger") },
  ];

  return (
    <section
      className="terminal-panel flex shrink-0 flex-col overflow-hidden bg-[var(--terminal-panel)]"
      style={{ height }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--terminal-border)] px-3">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "whitespace-nowrap py-2.5 text-xs font-medium transition",
                tab === item.key
                  ? "border-b-2 border-[var(--terminal-text)] text-[var(--terminal-text)]"
                  : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {item.label}
              {item.count != null && (
                <span className="ml-0.5 text-[var(--terminal-muted)]">
                  ({item.count})
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === "open" && symbolOpen.length > 0 && (
          <button
            type="button"
            onClick={() => void cancelAll(symbol)}
            className="shrink-0 px-2 py-1 text-xs text-down hover:underline"
          >
            {t("trade.cancelAll")}
          </button>
        )}
      </div>

      {tab === "history" && (
        <>
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--terminal-border)] px-3 py-2">
            <DeskSelect label={t("trade.allTradeTypes")} />
            <DeskSelect label={t("trade.sortByOrderTime")} />
            <span className="hidden h-4 w-px bg-[var(--terminal-border)] sm:block" />
            <DeskCheckbox
              checked={currentSymbolOnly}
              onChange={setCurrentSymbolOnly}
              label={t("trade.currentSymbolOnly")}
            />
            <DeskCheckbox
              checked={hideCancelled}
              onChange={setHideCancelled}
              label={t("trade.hideCancelled")}
            />
            <button
              type="button"
              className="ml-auto flex items-center gap-3 text-[var(--terminal-muted)]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <Link
                href="/orders"
                className="text-xs hover:text-[var(--terminal-text)] hover:underline"
              >
                {t("trade.viewMore")}
              </Link>
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--terminal-border)] px-3 py-2">
            {historySubTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setHistorySubTab(item.key)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[11px] transition",
                  historySubTab === item.key
                    ? "border-[var(--terminal-text)] bg-[var(--terminal-text)] text-[var(--terminal-bg)]"
                    : "border-[var(--terminal-border-strong)] text-[var(--terminal-muted)] hover:border-[var(--terminal-text)] hover:text-[var(--terminal-text)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="terminal-scroll min-h-0 flex-1 overflow-auto">
        {!user ? (
          <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center px-6 py-10 text-sm text-[var(--terminal-muted)]">
            <p className="text-center">
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="text-[var(--terminal-accent)] hover:underline"
              >
                {t("trade.deskLogin")}
              </button>
              {locale === "zh" ? "或" : " or "}
              <Link
                href="/register"
                className="text-[var(--terminal-accent)] hover:underline"
              >
                {t("trade.deskRegister")}
              </Link>
              {locale === "zh" ? "开始交易" : " to start trading"}
            </p>
          </div>
        ) : tab === "open" && (
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
                  onClick={() => void cancelOrder(o.id)}
                  className="text-down hover:underline"
                >
                  {t("trade.cancel")}
                </button>,
              ];
            })}
          />
        )}
        {user && tab === "history" && (
          historySubTab !== "limitMarket" ? (
            <DeskEmptyState title={t("trade.historyEmptyTitle")}>
              {t("common.comingSoon")}
            </DeskEmptyState>
          ) : (
            <DeskTable
              emptyNode={
                <DeskEmptyState title={t("trade.historyEmptyTitle")}>
                  {t("trade.historyEmptyDescBefore")}{" "}
                  <Link href="/orders" className="underline hover:text-[var(--terminal-text)]">
                    {t("orders.title")}
                  </Link>
                  {t("trade.historyEmptyDescAfter")}
                </DeskEmptyState>
              }
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
          )
        )}
        {user && tab === "trades" && (
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
        {user && tab === "assets" && (
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

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
}

function DeskSelect({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-[var(--terminal-border-strong)] px-2 py-1 text-[11px] text-[var(--terminal-muted)] transition hover:text-[var(--terminal-text)]"
    >
      {label}
      <ChevronDown className="h-3 w-3 opacity-60" />
    </button>
  );
}

function DeskCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-[var(--terminal-muted)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[var(--terminal-border-strong)]"
      />
      {label}
    </label>
  );
}

function DeskEmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--terminal-border)] bg-[var(--terminal-panel-2)]">
        <Inbox className="h-9 w-9 text-[var(--terminal-muted)]" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--terminal-border)] bg-[var(--terminal-panel)] text-[10px] text-[var(--terminal-muted)]">
          !
        </span>
      </div>
      <p className="text-sm font-medium text-[var(--terminal-text)]">{title}</p>
      <p className="mt-2 max-w-md text-center text-xs leading-relaxed text-[var(--terminal-muted)]">
        {children}
      </p>
    </div>
  );
}

function DeskTable({
  headers,
  rows,
  empty,
  emptyNode,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  empty?: string;
  emptyNode?: React.ReactNode;
}) {
  if (rows.length === 0) {
    if (emptyNode) return <>{emptyNode}</>;
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
