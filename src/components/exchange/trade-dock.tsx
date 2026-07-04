"use client";

import { useRef, useState } from "react";
import { GripHorizontal, Minus, Plus } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useTradeDockStore } from "@/stores/use-trade-dock-store";
import { OrderBookView } from "@/components/exchange/order-book";
import { OrderForm } from "@/components/exchange/order-form";
import type { OrderBook } from "@/types/exchange";

interface TradeDockProps {
  symbol: string;
  lastPrice: number;
  book: OrderBook;
}

export function TradeDock({ symbol, lastPrice, book }: TradeDockProps) {
  const t = useExchangeT();
  const { tab, x, y, collapsed, setTab, setPosition, setCollapsed } =
    useTradeDockStore();
  const [fillPrice, setFillPrice] = useState<number | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { px: e.clientX, py: e.clientY, ox: x, oy: y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.px;
    const dy = e.clientY - dragRef.current.py;
    setPosition(
      Math.max(8, dragRef.current.ox - dx),
      Math.max(8, dragRef.current.oy - dy),
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg"
      >
        <Plus className="h-4 w-4" />
        {t("trade.dock")}
      </button>
    );
  }

  return (
    <div
      className="glass-panel fixed z-30 flex w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{ right: x, bottom: y }}
    >
      <div
        className="flex cursor-grab items-center justify-between border-b border-border px-3 py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center gap-2 text-xs text-muted">
          <GripHorizontal className="h-4 w-4" />
          {t("trade.dock")}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-muted hover:bg-surface-muted"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 border-b border-border">
        {(["order", "book"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`py-2 text-xs font-medium ${
              tab === k ? "bg-primary/10 text-primary" : "text-muted"
            }`}
          >
            {k === "order" ? t("trade.placeOrder") : t("trade.orderBook")}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {tab === "order" ? (
          <OrderForm
            symbol={symbol}
            lastPrice={lastPrice}
            fillPrice={fillPrice}
            onFillPriceConsumed={() => setFillPrice(null)}
          />
        ) : (
          <OrderBookView
            symbol={symbol}
            book={book}
            compact
            maxLevels={10}
            onPriceClick={(p) => {
              setFillPrice(p);
              setTab("order");
            }}
          />
        )}
      </div>
    </div>
  );
}
