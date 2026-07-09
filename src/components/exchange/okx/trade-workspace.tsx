"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TVResolution } from "@/app/trade/_types/chart";
import { ChartStage } from "@/components/exchange/okx/chart-stage";
import { OkxOrderBookPanel } from "@/components/exchange/okx/okx-order-book-panel";
import { OkxSpotOrderForm } from "@/components/exchange/okx/okx-spot-order-form";
import { FuturesOrderForm } from "@/components/exchange/okx/futures-order-form";
import { InstrumentBar } from "@/components/exchange/terminal/instrument-bar";
import { BottomDesk } from "@/components/exchange/terminal/bottom-desk";
import { TickerTape } from "@/components/exchange/terminal/ticker-tape";
import { MarketSidePanel } from "@/components/exchange/terminal/market-side-panel";
import { RecentTradesPanel } from "@/components/exchange/terminal/recent-trades-panel";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { useTerminalStore } from "@/stores/use-terminal-store";
import { useLayoutStore, type LayoutPreset } from "@/stores/use-layout-store";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TradeMode } from "@/stores/use-trade-mode-store";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
 * 可拖拽 纵向 分隔线（调整列宽，左右拖）
 * ───────────────────────────────────────────── */
function VDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const active = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      active.current = true;
      lastX.current = e.clientX;
      e.preventDefault();

      const onMove = (ev: MouseEvent) => {
        if (!active.current) return;
        onDrag(ev.clientX - lastX.current);
        lastX.current = ev.clientX;
      };
      const onUp = () => {
        active.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onDrag],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative z-10 flex w-1.5 shrink-0 cursor-col-resize flex-col items-center justify-center bg-[var(--terminal-border)] transition-colors hover:bg-[var(--terminal-accent)]/60"
    >
      {/* 悬停时的指示点 */}
      <div className="h-6 w-0.5 rounded-full bg-[var(--terminal-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 可拖拽 横向分隔线（无握把图标，细线可拖）
 * ───────────────────────────────────────────── */
function HResizeStrip({
  onDrag,
  className,
  "aria-label": ariaLabel,
}: {
  onDrag: (dy: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const active = useRef(false);
  const lastY = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      active.current = true;
      lastY.current = e.clientY;
      e.preventDefault();

      const onMove = (ev: MouseEvent) => {
        if (!active.current) return;
        onDrag(ev.clientY - lastY.current);
        lastY.current = ev.clientY;
      };
      const onUp = () => {
        active.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onDrag],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={ariaLabel}
      onMouseDown={onMouseDown}
      className={cn(
        "relative z-30 shrink-0 cursor-row-resize bg-[var(--terminal-border)] transition-colors hover:bg-[var(--terminal-accent)]/40",
        "h-px before:absolute before:inset-x-0 before:-top-2 before:-bottom-2 before:content-['']",
        className,
      )}
    />
  );
}

function HDivider({ onDrag }: { onDrag: (dy: number) => void }) {
  return <HResizeStrip onDrag={onDrag} />;
}

/* ─────────────────────────────────────────────
 * OKX 风格垂直比例：底部委托区约占可用高度 30%
 * ───────────────────────────────────────────── */
const DESK_TAB_MIN = 40;
const DESK_EXPANDED_MIN = 220;
const DESK_DEFAULT_RATIO = 0.3;
const DESK_MAIN_MIN = 360;
const FORM_HEIGHT_RATIO = 0.38;
const FORM_HEIGHT_MIN = 220;
const CHART_HEIGHT_MIN = 200;

function getDeskLayoutMetrics(root: HTMLElement) {
  const kids = Array.from(root.children) as HTMLElement[];
  const instrumentH = kids[0]?.offsetHeight ?? 48;
  const tickerH = kids[kids.length - 1]?.offsetHeight ?? 28;
  const resizerH = 4;
  const available = root.clientHeight - instrumentH - tickerH - resizerH;
  const max = Math.max(DESK_TAB_MIN, available - DESK_MAIN_MIN);
  const preferred = Math.round(available * DESK_DEFAULT_RATIO);
  return {
    available,
    max,
    preferred: Math.max(DESK_EXPANDED_MIN, Math.min(max, preferred)),
  };
}

/* ─────────────────────────────────────────────
 * 底部委托区 全宽拖拽条（与左右面板对齐）
 * ───────────────────────────────────────────── */
function BottomDeskResizer({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const setHeight = useTerminalStore((s) => s.setBottomDeskHeight);

  const clampDesk = useCallback(
    (h: number) => {
      const root = containerRef.current;
      if (!root) return Math.max(DESK_TAB_MIN, h);

      const { max } = getDeskLayoutMetrics(root);
      return Math.max(DESK_TAB_MIN, Math.min(max, h));
    },
    [containerRef],
  );

  useEffect(() => {
    const sync = () => {
      const root = containerRef.current;
      if (!root) return;

      const current = useTerminalStore.getState().bottomDeskHeight;
      const { preferred } = getDeskLayoutMetrics(root);

      // 曾被压到仅 Tab 高度时，恢复 OKX 默认展开高度
      if (current < DESK_EXPANDED_MIN) {
        setHeight(preferred);
        return;
      }

      setHeight(clampDesk(current));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [clampDesk, containerRef, setHeight]);

  const onDrag = useCallback(
    (dy: number) => {
      const current = useTerminalStore.getState().bottomDeskHeight;
      setHeight(clampDesk(current - dy));
    },
    [clampDesk, setHeight],
  );

  return (
    <HResizeStrip
      onDrag={onDrag}
      className="z-30 w-full shrink-0"
      aria-label="调整底部面板高度"
    />
  );
}

/* ─────────────────────────────────────────────
 * 中间列：K 线 + 下单（OKX 约 62% / 38%）
 * ───────────────────────────────────────────── */
function ChartFormColumn({
  chart,
  orderForm,
}: {
  chart: React.ReactNode;
  orderForm: React.ReactNode;
}) {
  const centerRef = useRef<HTMLDivElement>(null);
  const [formH, setFormH] = useState(268);
  const formInit = useRef(false);

  const metrics = useCallback((total: number) => {
    const max = Math.max(FORM_HEIGHT_MIN, total - CHART_HEIGHT_MIN);
    const preferred = Math.round(total * FORM_HEIGHT_RATIO);
    return {
      preferred: Math.max(FORM_HEIGHT_MIN, Math.min(max, preferred)),
      max,
      min: FORM_HEIGHT_MIN,
    };
  }, []);

  const clampFormH = useCallback(
    (v: number, total?: number) => {
      const h = total ?? centerRef.current?.clientHeight ?? 600;
      const { min, max } = metrics(h);
      return Math.max(min, Math.min(max, v));
    },
    [metrics],
  );

  useEffect(() => {
    const sync = () => {
      const total = centerRef.current?.clientHeight;
      if (!total) return;

      if (!formInit.current) {
        formInit.current = true;
        setFormH(metrics(total).preferred);
        return;
      }

      setFormH((h) => clampFormH(h, total));
    };

    sync();
    const el = centerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampFormH, metrics]);

  return (
    <div ref={centerRef} className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">{chart}</div>
      <HDivider onDrag={(dy) => setFormH((h) => clampFormH(h - dy))} />
      <div
        className="shrink-0 overflow-y-auto bg-[var(--terminal-panel)]"
        style={{ height: formH }}
      >
        {orderForm}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 面板容器
 * ───────────────────────────────────────────── */
function Pane({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden", className)}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 主组件
 * ───────────────────────────────────────────── */
export function TradeWorkspace({ symbol, mode }: { symbol: string; mode: TradeMode }) {
  const t = useExchangeT();
  const rootRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<TVResolution>("15");
  const [fillLevel, setFillLevel] = useState<{ price: number; qty: number } | null>(null);
  const deskHeight = useTerminalStore((s) => s.bottomDeskHeight);
  const layout = useLayoutStore((s) => s.layout);
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!authHydrated) return;

    const store = useTradingStore.getState();
    if (!user) {
      store.clearForLogout();
      return;
    }

    void store.hydrate();
    const timer = window.setInterval(() => {
      if (!useAuthStore.getState().user) return;
      void store.refreshBalances();
      void store.refreshOrders();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [authHydrated, user]);

  const tickers = useMockMarketStore((s) => s.tickers);
  const orderBooks = useMockMarketStore((s) => s.orderBooks);
  const recentTrades = useMockMarketStore((s) => s.recentTrades);
  const ticker = tickers[symbol];
  const book = orderBooks[symbol];
  const trades = recentTrades[symbol] ?? [];

  if (!ticker) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        {t("common.loading")}
      </div>
    );
  }

  const orderForm =
    mode === "spot" ? (
      <OkxSpotOrderForm
        symbol={symbol}
        lastPrice={ticker.last}
        fillLevel={fillLevel}
        onFillLevelConsumed={() => setFillLevel(null)}
        variant={layout === "pro-right" ? "pro" : "dual"}
      />
    ) : (
      <FuturesOrderForm
        symbol={symbol}
        lastPrice={ticker.last}
        fillLevel={fillLevel}
        onFillLevelConsumed={() => setFillLevel(null)}
      />
    );

  const orderBook = book ? (
    <OkxOrderBookPanel
      symbol={symbol}
      book={book}
      trades={trades}
      lastPrice={ticker.last}
      onLevelClick={setFillLevel}
      bookOnly={layout === "pro-left"}
    />
  ) : null;

  return (
    <div
      ref={rootRef}
      className="terminal-root flex h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden bg-[var(--terminal-bg)]"
      style={{ ["--desk-h" as string]: `${deskHeight}px` }}
    >
      <InstrumentBar ticker={ticker} mode={mode} />

      <div className="min-h-0 flex-1 overflow-hidden">
        <LayoutBody
          layout={layout}
          symbol={symbol}
          mode={mode}
          interval={interval}
          onIntervalChange={setInterval}
          orderBook={orderBook}
          orderForm={orderForm}
          trades={trades}
        />
      </div>

      <BottomDeskResizer containerRef={rootRef} />
      <BottomDesk symbol={symbol} />
      <TickerTape />
    </div>
  );
}

/* ─────────────────────────────────────────────
 * 布局渲染（每列宽度可拖拽）
 * ───────────────────────────────────────────── */
function LayoutBody({
  layout,
  symbol,
  mode,
  interval,
  onIntervalChange,
  orderBook,
  orderForm,
  trades,
}: {
  layout: LayoutPreset;
  symbol: string;
  mode: TradeMode;
  interval: TVResolution;
  onIntervalChange: (v: TVResolution) => void;
  orderBook: React.ReactNode;
  orderForm: React.ReactNode;
  trades: import("@/types/exchange").MarketTrade[];
}) {
  /* 列宽 state（每种布局各自独立） */
  const [stdBookW,   setStdBookW]   = useState(260); // standard: 订单簿列
  const [stdSymbolW, setStdSymbolW] = useState(320); // standard: 币对列表列
  const [proBookW,   setProBookW]   = useState(260); // pro-right: 订单簿列
  const [proFormW,   setProFormW]   = useState(320); // pro-right: 下单列
  const [wideMarketW,  setWideMarketW]  = useState(320); // pro-left: 市场列表
  const [wideBookW,    setWideBookW]    = useState(240); // pro-left: 订单簿
  const [wideTradesW,  setWideTradesW]  = useState(180); // pro-left: 成交

  const clampW = (v: number, min = 100, max = 600) => Math.max(min, Math.min(max, v));

  const chart = (iv: TVResolution, onChange?: (v: TVResolution) => void) => (
    <ChartStage symbol={symbol} interval={iv} onIntervalChange={onChange ?? (() => {})} />
  );

  /* ════════════════════════════════════════
   * 标准版
   * [订单簿 ⟺] [K线 + 下单] [⟺ 币对列表]
   * ════════════════════════════════════════ */
  if (layout === "standard") {
    return (
      <div className="flex h-full">
        <Pane style={{ width: stdBookW, minWidth: 140 }}>
          {orderBook}
        </Pane>

        <VDivider onDrag={(dx) => {
          setStdBookW((w) => clampW(w + dx));
        }} />

        <Pane className="flex-1">
          <ChartFormColumn
            chart={chart(interval, onIntervalChange)}
            orderForm={orderForm}
          />
        </Pane>

        <VDivider onDrag={(dx) => {
          setStdSymbolW((w) => clampW(w - dx, 280, 480));
        }} />

        <Pane style={{ width: stdSymbolW, minWidth: 280 }}>
          <MarketSidePanel currentSymbol={symbol} />
        </Pane>
      </div>
    );
  }

  /* ════════════════════════════════════════
   * 专业模式
   * [K线] [⟺ 订单簿 ⟺] [下单]
   * ════════════════════════════════════════ */
  if (layout === "pro-right") {
    return (
      <div className="flex h-full">
        {/* 左：K线 */}
        <Pane className="flex-1">
          {chart(interval, onIntervalChange)}
        </Pane>

        <VDivider onDrag={(dx) => {
          setProBookW((w) => clampW(w - dx));
        }} />

        {/* 中：订单簿 */}
        <Pane className="overflow-y-auto" style={{ width: proBookW, minWidth: 160 }}>
          {orderBook}
        </Pane>

        <VDivider onDrag={(dx) => {
          setProFormW((w) => clampW(w - dx, 280, 420));
        }} />

        {/* 右：下单 */}
        <Pane
          className="flex min-h-0 flex-col overflow-hidden bg-[var(--terminal-panel)]"
          style={{ width: proFormW, minWidth: 280 }}
        >
          {orderForm}
        </Pane>
      </div>
    );
  }

  /* ════════════════════════════════════════
   * 宽平模式
   * [市场 ⟺] [K线 + 下单] [⟺ 订单簿 ⟺] [成交]
   * ════════════════════════════════════════ */
  if (layout === "pro-left") {
    return (
      <div className="flex h-full">
        <Pane style={{ width: wideMarketW, minWidth: 280 }}>
          <MarketSidePanel currentSymbol={symbol} />
        </Pane>

        <VDivider onDrag={(dx) => {
          setWideMarketW((w) => clampW(w + dx, 280, 480));
        }} />

        <Pane className="flex-1">
          <ChartFormColumn
            chart={chart(interval, onIntervalChange)}
            orderForm={orderForm}
          />
        </Pane>

        <VDivider onDrag={(dx) => {
          setWideBookW((w) => clampW(w - dx, 160, 400));
        }} />

        <Pane className="overflow-y-auto" style={{ width: wideBookW, minWidth: 160 }}>
          {orderBook}
        </Pane>

        <VDivider onDrag={(dx) => {
          setWideTradesW((w) => clampW(w - dx, 120, 280));
        }} />

        <Pane style={{ width: wideTradesW, minWidth: 120 }}>
          <RecentTradesPanel symbol={symbol} trades={trades} />
        </Pane>
      </div>
    );
  }

  return null;
}
