"use client";

import { useEffect, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

export function FuturesOrderForm({
  symbol,
  lastPrice,
  fillLevel,
  onFillLevelConsumed,
}: {
  symbol: string;
  lastPrice: number;
  fillLevel?: { price: number; qty: number } | null;
  onFillLevelConsumed?: () => void;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const [side, setSide] = useState<"long" | "short">("long");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [leverage, setLeverage] = useState(10);
  const [type, setType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState(String(lastPrice));
  const [qty, setQty] = useState("");

  useEffect(() => {
    setPrice(String(lastPrice));
  }, [lastPrice, symbol]);

  useEffect(() => {
    if (!fillLevel || fillLevel.price <= 0) return;
    setPrice(String(fillLevel.price));
    if (fillLevel.qty > 0) {
      setQty(fillLevel.qty.toFixed(meta?.qtyPrecision ?? 4));
    }
    onFillLevelConsumed?.();
  }, [fillLevel, onFillLevelConsumed, meta?.qtyPrecision]);

  const submit = () => {
    toast.success(
      `${side === "long" ? t("trade.openLong") : t("trade.openShort")} · ${leverage}x`,
    );
    setQty("");
  };

  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-[var(--terminal-bg)] p-0.5">
        {(["long", "short"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn(
              "rounded-md py-2 text-xs font-semibold",
              side === s
                ? s === "long"
                  ? "bg-up text-white"
                  : "bg-down text-white"
                : "text-muted",
            )}
          >
            {s === "long" ? t("trade.openLong") : t("trade.openShort")}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {(["cross", "isolated"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarginMode(m)}
            className={cn(
              "flex-1 rounded py-1 text-[10px]",
              marginMode === m
                ? "bg-primary/20 text-primary"
                : "text-muted",
            )}
          >
            {m === "cross" ? t("trade.cross") : t("trade.isolated")}
          </button>
        ))}
        <span className="rounded bg-[var(--terminal-bg)] px-2 py-1 text-[10px] font-mono text-accent">
          {leverage}x
        </span>
      </div>

      <input
        type="range"
        min={1}
        max={100}
        value={leverage}
        onChange={(e) => setLeverage(Number(e.target.value))}
        className="w-full accent-accent"
      />

      <div className="flex gap-1">
        {(["limit", "market"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => setType(tp)}
            className={cn(
              "flex-1 rounded py-1 text-[10px]",
              type === tp
                ? "bg-[var(--terminal-panel)] text-foreground"
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
            className="mt-0.5 w-full rounded border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-1.5 font-mono text-xs tabular-nums outline-none"
          />
        </label>
      )}

      <label className="block text-[10px] text-muted">
        {t("trade.quantity")} ({meta?.base})
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="mt-0.5 w-full rounded border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-1.5 font-mono text-xs tabular-nums outline-none"
        />
      </label>

      <p className="text-[10px] text-muted">
        {t("trade.available")}: {formatPrice(50000, 2, locale)} USDT
      </p>

      <button
        type="button"
        onClick={submit}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-semibold text-white",
          side === "long" ? "bg-up" : "bg-down",
        )}
      >
        {side === "long" ? t("trade.openLong") : t("trade.openShort")}{" "}
        {meta?.base}
      </button>

      <div className="rounded border border-[var(--terminal-border)] p-2 text-[10px] text-muted">
        <p>{t("trade.marginRatio")}: 0.12%</p>
        <p>{t("trade.markPrice")}: {formatPrice(lastPrice, meta?.pricePrecision ?? 2, locale)}</p>
      </div>
    </div>
  );
}
