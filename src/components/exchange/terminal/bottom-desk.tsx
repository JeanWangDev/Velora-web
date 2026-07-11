"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Inbox,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { SpotService } from "@/services/spot-service";
import { useFuturesStore } from "@/stores/use-futures-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { useTerminalStore, type BottomDeskTab } from "@/stores/use-terminal-store";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import type { TradeMode } from "@/stores/use-trade-mode-store";
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

interface AlgoRow {
  algoNo: string;
  symbol: string;
  side: string;
  algoType: string;
  triggerPrice: number;
  orderPrice: number | null;
  quantity: number;
  status: string;
  createdAt: number;
}

export function BottomDesk({ symbol, mode }: { symbol: string; mode: TradeMode }) {
  if (mode === "futures") {
    return <FuturesBottomDesk symbol={symbol} />;
  }
  return <SpotBottomDesk symbol={symbol} />;
}

function FuturesBottomDesk({ symbol }: { symbol: string }) {
  const t = useExchangeT();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const [loginOpen, setLoginOpen] = useState(false);
  const tab = useTerminalStore((s) => s.bottomTab);
  const setTab = useTerminalStore((s) => s.setBottomTab);
  const height = useTerminalStore((s) => s.bottomDeskHeight);
  const positions = useFuturesStore((s) => s.positions);
  const openOrders = useFuturesStore((s) => s.openOrders);
  const orderHistory = useFuturesStore((s) => s.orderHistory);
  const refresh = useFuturesStore((s) => s.refresh);
  const cancelOrder = useFuturesStore((s) => s.cancelOrder);
  const balances = useTradingStore((s) => s.getAccountBalances("futures"));

  const [currentSymbolOnly, setCurrentSymbolOnly] = useState(true);

  useEffect(() => {
    if (!user) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [user, refresh, symbol]);

  const symPositions = currentSymbolOnly
    ? positions.filter((p) => p.symbol === symbol)
    : positions;
  const symOpen = currentSymbolOnly
    ? openOrders.filter((o) => o.symbol === symbol)
    : openOrders;
  const symHistory = currentSymbolOnly
    ? orderHistory.filter((o) => o.symbol === symbol)
    : orderHistory;

  const tabs: { key: BottomDeskTab; label: string; count?: number }[] = [
    { key: "open", label: t("trade.openOrders"), count: symOpen.length },
    { key: "history", label: t("trade.orderHistory") },
    { key: "trades", label: "持仓", count: symPositions.length },
    { key: "assets", label: t("assets.title") },
  ];

  return (
    <DeskShell
      height={height}
      tab={tab}
      setTab={setTab}
      tabs={tabs}
      user={user}
      loginOpen={loginOpen}
      setLoginOpen={setLoginOpen}
      t={t}
      locale={locale}
      filters={
        <DeskCheckbox
          checked={currentSymbolOnly}
          onChange={setCurrentSymbolOnly}
          label={t("trade.currentSymbolOnly")}
        />
      }
    >
      {!user ? null : tab === "open" ? (
        <DeskTable
          empty={t("orders.empty")}
          headers={["时间", "方向", "类型", "价格", "数量", "状态", ""]}
          rows={symOpen.map((o) => [
            formatDateTime(o.createdAt, locale),
            <span key="s" className={o.side === "buy" ? "text-up" : "text-down"}>
              {o.posSide} {o.side}
            </span>,
            o.type,
            formatPrice(o.price, 2, locale),
            formatQty(o.quantity, 0),
            o.status,
            o.status === "open" || o.status === "partial" ? (
              <button
                key="c"
                type="button"
                onClick={() => void cancelOrder(o.orderNo)}
                className="text-down hover:underline"
              >
                {t("trade.cancel")}
              </button>
            ) : (
              ""
            ),
          ])}
        />
      ) : tab === "history" ? (
        <DeskTable
          empty={t("orders.empty")}
          headers={["时间", "方向", "类型", "价格", "成交/总量", "状态"]}
          rows={symHistory.map((o) => [
            formatDateTime(o.createdAt, locale),
            `${o.posSide} ${o.side}`,
            o.type,
            formatPrice(o.price, 2, locale),
            `${formatQty(o.filledQuantity, 0)} / ${formatQty(o.quantity, 0)}`,
            o.status,
          ])}
        />
      ) : tab === "trades" ? (
        <DeskTable
          empty={t("orders.empty")}
          headers={["合约", "方向", "张数", "开仓价", "标记价", "未实现盈亏", "强平价"]}
          rows={symPositions.map((p) => [
            p.symbol,
            <span key="s" className={p.side === "long" ? "text-up" : "text-down"}>
              {p.side}
            </span>,
            formatQty(p.quantity, 0),
            formatPrice(p.entryPrice, 2, locale),
            formatPrice(p.markPrice, 2, locale),
            <span
              key="pnl"
              className={p.unrealizedPnl >= 0 ? "text-up" : "text-down"}
            >
              {formatPrice(p.unrealizedPnl, 2, locale)}
            </span>,
            formatPrice(p.liquidationPrice, 2, locale),
          ])}
        />
      ) : (
        <DeskTable
          empty={t("common.noData")}
          headers={[t("assets.currency"), t("assets.available"), t("assets.frozen"), t("assets.totalCol")]}
          rows={balances.map((b) => [
            b.currency,
            formatPrice(b.available, 8, locale),
            formatPrice(b.frozen, 8, locale),
            formatPrice(b.available + b.frozen, 8, locale),
          ])}
        />
      )}
    </DeskShell>
  );
}

function SpotBottomDesk({ symbol }: { symbol: string }) {
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
  const [algoOrders, setAlgoOrders] = useState<AlgoRow[]>([]);

  useEffect(() => {
    if (!user) return;
    if (historySubTab !== "tpsl" && historySubTab !== "trigger") return;
    void SpotService.listAlgoOrders(currentSymbolOnly ? symbol : undefined).then((res) => {
      const rows = (res.data ?? []) as Record<string, unknown>[];
      setAlgoOrders(
        rows.map((r) => ({
          algoNo: String(r.algoNo),
          symbol: String(r.symbol),
          side: String(r.side),
          algoType: String(r.algoType),
          triggerPrice: Number(r.triggerPrice),
          orderPrice: r.orderPrice != null ? Number(r.orderPrice) : null,
          quantity: Number(r.quantity),
          status: String(r.status),
          createdAt: Number(r.createdAt),
        })),
      );
    });
  }, [user, historySubTab, symbol, currentSymbolOnly]);

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

  const cancelAlgo = async (algoNo: string) => {
    await SpotService.cancelAlgoOrder(algoNo);
    setAlgoOrders((list) => list.filter((a) => a.algoNo !== algoNo));
  };

  return (
    <DeskShell
      height={height}
      tab={tab}
      setTab={setTab}
      tabs={tabs}
      user={user}
      loginOpen={loginOpen}
      setLoginOpen={setLoginOpen}
      t={t}
      locale={locale}
      cancelAll={
        tab === "open" && symbolOpen.length > 0 ? (
          <button
            type="button"
            onClick={() => void cancelAll(symbol)}
            className="shrink-0 px-2 py-1 text-xs text-down hover:underline"
          >
            {t("trade.cancelAll")}
          </button>
        ) : undefined
      }
      historyBar={
        tab === "history" ? (
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
        ) : undefined
      }
    >
      {!user ? null : tab === "open" ? (
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
      ) : tab === "history" ? (
        historySubTab === "tpsl" || historySubTab === "trigger" ? (
          <DeskTable
            empty={t("orders.empty")}
            headers={["时间", "类型", "方向", "触发价", "委托价", "数量", ""]}
            rows={algoOrders.map((a) => {
              const meta = getSymbolMeta(a.symbol);
              return [
                formatDateTime(a.createdAt, locale),
                a.algoType,
                a.side,
                formatPrice(a.triggerPrice, meta?.pricePrecision ?? 2, locale),
                a.orderPrice
                  ? formatPrice(a.orderPrice, meta?.pricePrecision ?? 2, locale)
                  : "市价",
                formatQty(a.quantity, meta?.qtyPrecision ?? 4),
                <button
                  key="c"
                  type="button"
                  onClick={() => void cancelAlgo(a.algoNo)}
                  className="text-down hover:underline"
                >
                  {t("trade.cancel")}
                </button>,
              ];
            })}
          />
        ) : historySubTab !== "limitMarket" ? (
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
      ) : tab === "trades" ? (
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
      ) : (
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
    </DeskShell>
  );
}

function DeskShell({
  height,
  tab,
  setTab,
  tabs,
  user,
  loginOpen,
  setLoginOpen,
  t,
  locale,
  cancelAll,
  historyBar,
  filters,
  children,
}: {
  height: number;
  tab: BottomDeskTab;
  setTab: (tab: BottomDeskTab) => void;
  tabs: { key: BottomDeskTab; label: string; count?: number }[];
  user: { id: string } | null;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
  t: (key: string) => string;
  locale: string;
  cancelAll?: React.ReactNode;
  historyBar?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}) {
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
                <span className="ml-0.5 text-[var(--terminal-muted)]">({item.count})</span>
              )}
            </button>
          ))}
        </div>
        {cancelAll}
        {filters && tab !== "history" && (
          <div className="flex items-center gap-2 px-2">{filters}</div>
        )}
      </div>

      {historyBar}

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
        ) : (
          children
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
    return <p className="py-10 text-center text-xs text-muted">{empty}</p>;
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
