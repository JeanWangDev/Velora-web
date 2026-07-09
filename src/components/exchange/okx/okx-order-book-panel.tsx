"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ChevronDown,
  Minus,
  MoreVertical,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale } from "@/i18n/use-translation";
import type { OrderBook, MarketTrade } from "@/types/exchange";
import { formatPrice, formatQty } from "@/utils/format-exchange";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { RecentTradesView } from "@/components/exchange/recent-trades";
import { cn } from "@/lib/cn";

type BookTab = "book" | "trades";
type BookMode = "both" | "ask" | "bid";
/** tab = 订单表/最新成交切换；stack = 上下堆叠 */
type PanelLayout = "tab" | "stack";

const DEPTH_STEPS = [0.01, 0.1, 1, 10] as const;
const BOTH_SIDE_LEVELS = 10;
const SINGLE_SIDE_LEVELS = 30;

function DepthModeIcon({ mode, active }: { mode: BookMode; active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
      className={active ? "opacity-100" : "opacity-45"}
    >
      {mode === "both" && (
        <>
          <rect x="1" y="2" width="5" height="2" fill="#E93E8B" opacity="0.9" />
          <rect x="1" y="5" width="4" height="2" fill="#E93E8B" opacity="0.7" />
          <rect x="1" y="8" width="5" height="2" fill="#98D330" opacity="0.9" />
          <rect x="1" y="11" width="3" height="2" fill="#98D330" opacity="0.7" />
        </>
      )}
      {mode === "ask" && (
        <>
          <rect x="2" y="2" width="10" height="2.5" fill="#E93E8B" opacity="0.85" />
          <rect x="2" y="5.5" width="8" height="2.5" fill="#E93E8B" opacity="0.65" />
          <rect x="2" y="9" width="10" height="2.5" fill="#E93E8B" opacity="0.45" />
        </>
      )}
      {mode === "bid" && (
        <>
          <rect x="2" y="2" width="10" height="2.5" fill="#98D330" opacity="0.85" />
          <rect x="2" y="5.5" width="8" height="2.5" fill="#98D330" opacity="0.65" />
          <rect x="2" y="9" width="10" height="2.5" fill="#98D330" opacity="0.45" />
        </>
      )}
    </svg>
  );
}

/** 布局预设图标：Tab / 上下堆叠 */
function LayoutPresetIcon({
  kind,
  active,
}: {
  kind: PanelLayout;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-14 flex-col overflow-hidden rounded border-2 bg-[var(--terminal-bg)] p-1",
        active ? "border-[var(--terminal-accent)]" : "border-[var(--terminal-border)]",
      )}
    >
      {kind === "tab" ? (
        <>
          <div className="mb-0.5 flex gap-1 text-[7px] text-muted">
            <span className="border-b border-white text-white">OB</span>
            <span>LT</span>
          </div>
          <div className="min-h-0 flex-1 rounded-sm bg-[var(--terminal-panel)]" />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-1 flex-col rounded-sm bg-[var(--terminal-panel)] px-0.5">
            <span className="text-[6px] text-muted">OB</span>
          </div>
          <div className="flex flex-1 flex-col rounded-sm bg-[var(--terminal-panel)] px-0.5">
            <span className="text-[6px] text-muted">LT</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function OkxOrderBookPanel({
  symbol,
  book,
  trades,
  lastPrice,
  onLevelClick,
  bookOnly = false,
}: {
  symbol: string;
  book: OrderBook;
  trades: MarketTrade[];
  lastPrice: number;
  onLevelClick?: (level: { price: number; qty: number }) => void;
  /** 宽平模式：右侧已有独立成交列，订单簿只显示深度 */
  bookOnly?: boolean;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const hydrated = useHydrated();
  const meta = getSymbolMeta(symbol);
  const precision = meta?.pricePrecision ?? 2;
  const qtyPrecision = meta?.qtyPrecision ?? 4;

  const [tab, setTab] = useState<BookTab>("book");
  const [mode, setMode] = useState<BookMode>("both");
  const [step, setStep] = useState(0.1);
  const [stepOpen, setStepOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [panelLayout, setPanelLayout] = useState<PanelLayout>("tab");
  const [showAvgTotal, setShowAvgTotal] = useState(false);
  const [showBuySellBar, setShowBuySellBar] = useState(true);
  const [showDepthBars, setShowDepthBars] = useState(true);
  const [clickFillQty, setClickFillQty] = useState(true);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (e: MouseEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [settingsOpen]);

  const levelCount = mode === "both" ? BOTH_SIDE_LEVELS : SINGLE_SIDE_LEVELS;

  const { asks, bids, maxCumQty } = useMemo(() => {
    const askSlice = book.asks.slice(0, levelCount);
    const bidSlice = book.bids.slice(0, levelCount);
    const asksDesc = [...askSlice].reverse();

    const askCums = asksDesc.reduce<number[]>((acc, l) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(prev + l.qty);
      return acc;
    }, []);
    const bidCums = bidSlice.reduce<number[]>((acc, l) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(prev + l.qty);
      return acc;
    }, []);

    return {
      asks: asksDesc,
      bids: bidSlice,
      maxCumQty: Math.max(...askCums, ...bidCums, 0.0001),
    };
  }, [book, levelCount]);

  const bidVol = bids.reduce((s, l) => s + l.qty, 0);
  const askVol = asks.reduce((s, l) => s + l.qty, 0);
  const totalVol = bidVol + askVol || 1;
  const buyPct = (bidVol / totalVol) * 100;
  const sellPct = 100 - buyPct;

  const avgAskPrice =
    asks.length > 0
      ? asks.reduce((s, l) => s + l.price * l.qty, 0) / askVol
      : lastPrice;
  const avgBidPrice =
    bids.length > 0
      ? bids.reduce((s, l) => s + l.price * l.qty, 0) / bidVol
      : lastPrice;

  const handleLevelClick = (price: number, cumQty: number) => {
    if (!onLevelClick) return;
    onLevelClick({
      price,
      qty: clickFillQty ? cumQty : 0,
    });
  };

  const renderRows = (levels: typeof asks, side: "ask" | "bid") => {
    let cumQty = 0;
    return levels.map((l) => {
      cumQty += l.qty;
      const widthPct = Math.min(
        100,
        Math.round((cumQty / maxCumQty) * 10000) / 100,
      );
      return (
        <button
          key={`${side}-${l.price}`}
          type="button"
          onClick={() => handleLevelClick(l.price, cumQty)}
          className="relative grid h-[22px] w-full grid-cols-3 items-center gap-1 px-2 text-left text-[11px] hover:bg-[var(--terminal-panel)]"
        >
          {showDepthBars && hydrated && (
            <span
              className={cn(
                "absolute inset-y-0 right-0",
                side === "bid" ? "bg-up/15" : "bg-down/15",
              )}
              style={{ width: `${widthPct}%` }}
            />
          )}
          <span
            className={cn(
              "relative font-mono tabular-nums",
              side === "bid" ? "text-up" : "text-down",
            )}
          >
            {formatPrice(l.price, precision, locale)}
          </span>
          <span className="relative text-right font-mono tabular-nums text-white">
            {formatQty(l.qty, qtyPrecision)}
          </span>
          <span className="relative text-right font-mono tabular-nums text-white">
            {formatQty(cumQty, qtyPrecision)}
          </span>
        </button>
      );
    });
  };

  const askRows = renderRows(asks, "ask");
  const bidRows = renderRows(bids, "bid");

  const bookBody = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--terminal-border)] px-2 py-1.5">
        <div className="flex items-center gap-2">
          {(["both", "ask", "bid"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded p-1 transition hover:bg-[var(--terminal-panel)]",
                mode === m && "bg-[var(--terminal-panel)]",
              )}
              title={
                m === "both"
                  ? locale === "zh"
                    ? "买卖盘"
                    : "Both"
                  : m === "ask"
                    ? locale === "zh"
                      ? "卖盘"
                      : "Asks"
                    : locale === "zh"
                      ? "买盘"
                      : "Bids"
              }
            >
              <DepthModeIcon mode={m} active={mode === m} />
            </button>
          ))}
        </div>
        <div className="relative flex items-center gap-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => {
              const idx = DEPTH_STEPS.indexOf(
                step as (typeof DEPTH_STEPS)[number],
              );
              if (idx > 0) setStep(DEPTH_STEPS[idx - 1]);
            }}
            className="rounded p-0.5 hover:bg-[var(--terminal-panel)]"
          >
            <Minus className="h-3 w-3 text-muted" />
          </button>
          <button
            type="button"
            onClick={() => setStepOpen((v) => !v)}
            className="flex min-w-[2.5rem] items-center justify-center gap-0.5 rounded border border-[var(--terminal-border)] px-1 py-0.5 font-mono hover:bg-[var(--terminal-panel)]"
          >
            {step}
            <ChevronDown className="h-2.5 w-2.5 text-muted" />
          </button>
          {stepOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 rounded border border-[var(--terminal-border)] bg-[var(--terminal-panel)] py-1 shadow-lg">
              {DEPTH_STEPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStep(s);
                    setStepOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-1 text-left font-mono hover:bg-[var(--terminal-panel)]",
                    step === s && "text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const idx = DEPTH_STEPS.indexOf(
                step as (typeof DEPTH_STEPS)[number],
              );
              if (idx >= 0 && idx < DEPTH_STEPS.length - 1)
                setStep(DEPTH_STEPS[idx + 1]);
            }}
            className="rounded p-0.5 hover:bg-[var(--terminal-panel)]"
          >
            <Plus className="h-3 w-3 text-muted" />
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1 px-2 py-1 text-[10px] text-[var(--terminal-muted)]">
        <span>
          {locale === "zh" ? "价格" : "Price"}({meta?.quote})
        </span>
        <span className="text-right">
          {locale === "zh" ? "数量" : "Amount"}({meta?.base})
        </span>
        <span className="text-right">
          {locale === "zh" ? "合计" : "Total"}({meta?.base})
        </span>
      </div>

      {showAvgTotal && (
        <div className="flex shrink-0 justify-between border-b border-[var(--terminal-border)] px-2 py-1 text-[10px] text-[var(--terminal-muted)]">
          <span>
            {locale === "zh" ? "均价" : "Avg"}{" "}
            <span className="font-mono text-white">
              {formatPrice(
                mode === "bid" ? avgBidPrice : avgAskPrice,
                precision,
                locale,
              )}
            </span>
          </span>
          <span>
            {locale === "zh" ? "合计" : "Total"}{" "}
            <span className="font-mono text-white">
              {formatQty(mode === "bid" ? bidVol : askVol, qtyPrecision)}{" "}
              {meta?.base}
            </span>
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {(mode === "both" || mode === "ask") && (
          <div
            className={cn(
              mode === "both"
                ? "shrink-0"
                : "orderbook-scroll min-h-0 flex-1 overflow-y-auto",
            )}
          >
            {askRows}
          </div>
        )}

        {/* 中间最新价：大号价格 + 右侧法币（OKX 横向布局） */}
        <div className="flex shrink-0 items-center justify-center gap-2 border-y border-[var(--terminal-border)] px-2 py-1.5">
          <span className="inline-flex items-center gap-0.5 font-mono text-lg font-semibold tabular-nums text-down">
            {formatPrice(lastPrice, precision, locale)}
            <ArrowDown className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-xs tabular-nums text-[var(--terminal-muted)]">
            ¥{formatPrice(lastPrice * 6.78, 1, locale)}
          </span>
        </div>

        {(mode === "both" || mode === "bid") && (
          <div
            className={cn(
              mode === "both"
                ? "shrink-0"
                : "orderbook-scroll min-h-0 flex-1 overflow-y-auto",
            )}
          >
            {bidRows}
          </div>
        )}
      </div>

      {/* OKX 斜切买卖比：B 方块 + 百分比 | 百分比 + S 方块 */}
      {showBuySellBar && (
        <div className="shrink-0 px-2 py-2">
          <div className="relative flex h-[22px] w-full overflow-hidden text-[11px] font-medium">
            <div
              className="flex items-center gap-1.5 bg-up/10 pl-1.5 text-up"
              style={{
                width: `${buyPct}%`,
                clipPath:
                  "polygon(0 0, calc(100% - 6px) 0, 100% 100%, 0 100%)",
              }}
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] bg-up text-[9px] font-bold leading-none text-black">
                B
              </span>
              <span className="truncate tabular-nums">{buyPct.toFixed(2)}%</span>
            </div>
            <div
              className="flex flex-1 items-center justify-end gap-1.5 bg-down/10 pr-1.5 text-down"
              style={{
                marginLeft: "-6px",
                clipPath: "polygon(6px 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              <span className="truncate tabular-nums">{sellPct.toFixed(2)}%</span>
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] bg-down text-[9px] font-bold leading-none text-black">
                S
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const tradesBody = (
    <div className="orderbook-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
      <RecentTradesView symbol={symbol} trades={trades} scroll />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--terminal-bg)]">
      {/* 顶栏：Tab + 设置 */}
      <div className="relative flex shrink-0 items-center border-b border-[var(--terminal-border)] px-2">
        {bookOnly ? (
          <span className="px-2 py-2 text-xs font-medium text-foreground">
            {t("trade.orderBookTab")}
          </span>
        ) : panelLayout === "tab" ? (
          (
            [
              { key: "book" as const, label: t("trade.orderBookTab") },
              { key: "trades" as const, label: t("trade.recentTrades") },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "px-2 py-2 text-xs",
                tab === item.key
                  ? "border-b-2 border-foreground font-medium text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))
        ) : (
          <span className="px-2 py-2 text-xs font-medium text-foreground">
            {t("trade.orderBookTab")} / {t("trade.recentTrades")}
          </span>
        )}

        <div className="relative ml-auto flex gap-1.5 py-1 text-muted" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "rounded p-1 hover:bg-[var(--terminal-panel)] hover:text-foreground",
              settingsOpen && "bg-[var(--terminal-panel)] text-foreground",
            )}
            title={locale === "zh" ? "布局设置" : "Layout settings"}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1 hover:bg-[var(--terminal-panel)] hover:text-foreground">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* 布局设置弹层（仅前两种布局） */}
          {settingsOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-[260px] rounded-lg border border-[var(--terminal-border)] bg-[var(--terminal-bg)] p-3 shadow-2xl">
              {!bookOnly && (
                <div className="mb-3 flex gap-3">
                  {(
                    [
                      { key: "tab" as const, label: locale === "zh" ? "标签切换" : "Tabs" },
                      { key: "stack" as const, label: locale === "zh" ? "上下布局" : "Stack" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPanelLayout(item.key)}
                      className="flex flex-col items-center gap-1"
                    >
                      <LayoutPresetIcon
                        kind={item.key}
                        active={panelLayout === item.key}
                      />
                      <span className="text-[10px] text-muted">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2.5 border-t border-[var(--terminal-border)] pt-3 text-xs">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={showAvgTotal}
                    onChange={(e) => setShowAvgTotal(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--terminal-border)]"
                  />
                  <span>
                    {locale === "zh"
                      ? "显示均价和合计数量"
                      : "Show avg price & total qty"}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={showBuySellBar}
                    onChange={(e) => setShowBuySellBar(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--terminal-border)]"
                  />
                  <span>
                    {locale === "zh" ? "显示买卖对比" : "Show buy/sell ratio"}
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={showDepthBars}
                    onChange={(e) => setShowDepthBars(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--terminal-border)]"
                  />
                  <span>
                    {locale === "zh"
                      ? "显示订单表背景色块"
                      : "Show depth background"}
                  </span>
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--terminal-border)] pt-3 text-xs">
                <span>
                  {locale === "zh"
                    ? "点击订单表带入数量"
                    : "Click to fill quantity"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={clickFillQty}
                  onClick={() => setClickFillQty((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition",
                    clickFillQty ? "bg-[var(--terminal-accent)]" : "bg-[var(--terminal-border)]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full transition",
                      clickFillQty
                        ? "left-[18px] bg-[var(--terminal-bg)]"
                        : "left-0.5 bg-[var(--terminal-muted)]",
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {bookOnly ? (
        bookBody
      ) : panelLayout === "tab" ? (
        tab === "book" ? (
          bookBody
        ) : (
          tradesBody
        )
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-[3] flex-col overflow-hidden border-b border-[var(--terminal-border)]">
            {bookBody}
          </div>
          <div className="flex min-h-0 flex-[2] flex-col overflow-hidden">
            <p className="shrink-0 border-b border-[var(--terminal-border)] px-2 py-1.5 text-xs font-medium">
              {t("trade.recentTrades")}
            </p>
            {tradesBody}
          </div>
        </div>
      )}
    </div>
  );
}
