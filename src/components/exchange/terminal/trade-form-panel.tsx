"use client";

import { useEffect, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import type { OrderSide, OrderType } from "@/types/exchange";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

interface TradeFormProps {
  symbol: string;
  lastPrice: number;
  fillPrice?: number | null;
  onFillPriceConsumed?: () => void;
}

function SideForm({
  symbol,
  lastPrice,
  side,
  fillPrice,
  onFillPriceConsumed,
}: TradeFormProps & { side: OrderSide }) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const balances = useMockTradingStore((s) => s.balances);
  const placeOrder = useMockTradingStore((s) => s.placeOrder);

  const [type, setType] = useState<OrderType>("limit");
  const [price, setPrice] = useState(String(lastPrice));
  const [qty, setQty] = useState("");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPrice(String(lastPrice));
    setQty("");
    setPct(0);
  }, [lastPrice, symbol, side]);

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

  const isBuy = side === "buy";

  return (
    <div className="space-y-2 p-2">
      <div className="flex gap-1">
        {(["limit", "market"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setType(tp)}
            className={cn(
              "flex-1 rounded py-1 text-[10px] font-medium",
              type === tp
                ? "bg-[var(--terminal-panel-2)] text-foreground"
                : "text-muted",
            )}
          >
            {t(`trade.${tp}`)}
          </button>
        ))}
      </div>

      {type === "limit" && (
        <label className="block text-[10px] text-muted">
          {t("trade.price")} ({meta?.quote})
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-0.5 w-full rounded border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-1.5 font-mono text-xs tabular-nums outline-none focus:border-primary/50"
          />
        </label>
      )}

      <label className="block text-[10px] text-muted">
        {t("trade.quantity")} ({meta?.base})
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="mt-0.5 w-full rounded border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-1.5 font-mono text-xs tabular-nums outline-none focus:border-primary/50"
        />
      </label>

      <div className="flex gap-0.5">
        {[25, 50, 75, 100].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => applyPct(p)}
            className={cn(
              "flex-1 rounded py-0.5 text-[9px]",
              pct === p ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground",
            )}
          >
            {p}%
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muted">
        {t("trade.available")}{" "}
        <span className="font-mono text-foreground">
          {side === "buy"
            ? formatPrice(available, 2, locale)
            : available.toFixed(meta?.qtyPrecision ?? 4)}{" "}
          {side === "buy" ? meta?.quote : meta?.base}
        </span>
      </p>

      <button
        type="button"
        onClick={submit}
        className={cn(
          "w-full rounded py-2 text-xs font-semibold text-white transition hover:brightness-110",
          isBuy ? "bg-up" : "bg-down",
        )}
      >
        {t(`trade.${side}`)} {meta?.base}
      </button>
    </div>
  );
}

export function TradeFormPanel({
  symbol,
  lastPrice,
  fillPrice,
  onFillPriceConsumed,
}: TradeFormProps) {
  const t = useExchangeT();

  return (
    <div className="shrink-0 border-t border-[var(--terminal-border)]">
      <p className="border-b border-[var(--terminal-border)] px-2 py-1.5 text-xs font-medium">
        {t("trade.placeOrder")}
      </p>
      <div className="grid grid-cols-2 divide-x divide-[var(--terminal-border)]">
        <SideForm
          symbol={symbol}
          lastPrice={lastPrice}
          side="buy"
          fillPrice={fillPrice}
          onFillPriceConsumed={onFillPriceConsumed}
        />
        <SideForm
          symbol={symbol}
          lastPrice={lastPrice}
          side="sell"
          fillPrice={fillPrice}
          onFillPriceConsumed={onFillPriceConsumed}
        />
      </div>
    </div>
  );
}
