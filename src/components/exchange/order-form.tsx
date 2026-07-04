"use client";

import { useEffect, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import type { OrderSide, OrderType } from "@/types/exchange";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";

interface OrderFormProps {
  symbol: string;
  lastPrice: number;
  fillPrice?: number | null;
  onFillPriceConsumed?: () => void;
  variant?: "default" | "terminal";
}

export function OrderForm({
  symbol,
  lastPrice,
  fillPrice,
  onFillPriceConsumed,
  variant = "default",
}: OrderFormProps) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const balances = useMockTradingStore((s) => s.balances);
  const placeOrder = useMockTradingStore((s) => s.placeOrder);

  const [side, setSide] = useState<OrderSide>("buy");
  const [type, setType] = useState<OrderType>("limit");
  const [price, setPrice] = useState(String(lastPrice));
  const [qty, setQty] = useState("");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPrice(String(lastPrice));
  }, [lastPrice, symbol]);

  useEffect(() => {
    if (fillPrice == null || fillPrice <= 0) return;
    setPrice(String(fillPrice));
    onFillPriceConsumed?.();
  }, [fillPrice, onFillPriceConsumed]);

  const quote = balances.find((b) => b.currency === meta?.quote);
  const base = balances.find((b) => b.currency === meta?.base);
  const available =
    side === "buy" ? (quote?.available ?? 0) : (base?.available ?? 0);

  const applyPct = (p: number) => {
    setPct(p);
    const pr = type === "limit" ? Number(price) || lastPrice : lastPrice;
    if (side === "buy") {
      setQty(((available / pr) * (p / 100)).toFixed(meta?.qtyPrecision ?? 4));
    } else {
      setQty((available * (p / 100)).toFixed(meta?.qtyPrecision ?? 4));
    }
  };

  const submit = () => {
    const quantity = Number(qty);
    const result = placeOrder({
      symbol,
      side,
      type,
      price: type === "limit" ? Number(price) : null,
      quantity,
    });
    if (!result.ok) {
      toast.error(t("trade.insufficient"));
      return;
    }
    toast.success(t("trade.orderPlaced"));
    setQty("");
    setPct(0);
  };

  const isTerminal = variant === "terminal";
  const inputCls = isTerminal
    ? "mt-1 w-full rounded border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2.5 py-2 font-mono text-sm tabular-nums outline-none focus:border-accent/60"
    : "mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-primary";

  return (
    <div className={isTerminal ? "space-y-3 p-3" : "space-y-3 p-3"}>
      <div
        className={
          isTerminal
            ? "grid grid-cols-2 gap-1 rounded-md bg-[var(--terminal-bg)] p-0.5"
            : "grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1"
        }
      >
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`py-2 text-sm font-medium transition ${
              side === s
                ? s === "buy"
                  ? "rounded-md bg-up text-white"
                  : "rounded-md bg-down text-white"
                : "text-muted"
            }`}
          >
            {t(`trade.${s}`)}
          </button>
        ))}
      </div>

      <div
        className={
          isTerminal
            ? "grid grid-cols-2 gap-1 rounded-md bg-[var(--terminal-bg)] p-0.5"
            : "grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1"
        }
      >
        {(["limit", "market"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setType(tp)}
            className={`rounded-md py-1.5 text-xs font-medium ${
              type === tp
                ? isTerminal
                  ? "bg-[var(--terminal-panel)] text-foreground"
                  : "bg-surface text-foreground"
                : "text-muted"
            }`}
          >
            {t(`trade.${tp}`)}
          </button>
        ))}
      </div>

      {type === "limit" && (
        <label className="block text-xs text-muted">
          {t("trade.price")}
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
          />
        </label>
      )}

      <label className="block text-xs text-muted">
        {t("trade.quantity")} ({meta?.base})
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-sm tabular-nums outline-none focus:border-primary"
        />
      </label>

      <div className="flex gap-1">
        {[0, 25, 50, 75, 100].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => applyPct(p)}
            className={`flex-1 rounded py-1 text-[10px] ${
              pct === p ? "bg-primary/20 text-primary" : "bg-surface-muted text-muted"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">
        {t("trade.available")}:{" "}
        <span className="font-mono tabular-nums text-foreground">
          {side === "buy"
            ? formatPrice(available, 2, locale)
            : available.toFixed(meta?.qtyPrecision ?? 4)}{" "}
          {side === "buy" ? meta?.quote : meta?.base}
        </span>
      </p>

      <button
        type="button"
        onClick={submit}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm ${
          side === "buy" ? "bg-up hover:brightness-110" : "bg-down hover:brightness-110"
        }`}
      >
        {t(`trade.${side}`)} {meta?.base}
      </button>
    </div>
  );
}
