"use client";

import { useEffect, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { FuturesService } from "@/services/futures-service";
import { useFuturesStore } from "@/stores/use-futures-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { spotToFuturesInstId } from "@/utils/symbol";
import { cn } from "@/lib/cn";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(user);
  const refreshFutures = useFuturesStore((s) => s.refresh);
  const refreshBalances = useTradingStore((s) => s.refreshBalances);
  const futuresBalances = useTradingStore((s) => s.getAccountBalances("futures"));
  const availableUsdt =
    futuresBalances.find((b) => b.currency === "USDT")?.available ?? 0;

  const [markPrice, setMarkPrice] = useState(lastPrice);

  useEffect(() => {
    const instId = spotToFuturesInstId(symbol);
    let cancelled = false;
    const load = async () => {
      try {
        const res = await FuturesService.listMarkPrices();
        const row = (res.data ?? []).find(
          (r) => String((r as Record<string, unknown>).symbol) === instId,
        ) as Record<string, unknown> | undefined;
        if (row && !cancelled) {
          setMarkPrice(Number(row.markPrice ?? lastPrice));
        }
      } catch {
        if (!cancelled) setMarkPrice(lastPrice);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [symbol, lastPrice]);

  useEffect(() => {
    setPrice(String(lastPrice));
  }, [lastPrice, symbol]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void refreshBalances();
    const instId = spotToFuturesInstId(symbol);
    void FuturesService.getPreference(instId)
      .then((pref) => {
        setLeverage(pref.leverage);
        setMarginMode(pref.marginMode);
      })
      .catch(() => {});
  }, [isLoggedIn, refreshBalances, symbol]);

  const persistLeverage = async (value: number) => {
    setLeverage(value);
    if (!isLoggedIn) return;
    try {
      await FuturesService.setLeverage(spotToFuturesInstId(symbol), value);
    } catch {
      /* 偏好同步失败不阻断交易 */
    }
  };

  const persistMarginMode = async (mode: "cross" | "isolated") => {
    setMarginMode(mode);
    if (!isLoggedIn) return;
    try {
      await FuturesService.setMarginMode(spotToFuturesInstId(symbol), mode);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!fillLevel || fillLevel.price <= 0) return;
    setPrice(String(fillLevel.price));
    if (fillLevel.qty > 0) {
      setQty(fillLevel.qty.toFixed(meta?.qtyPrecision ?? 4));
    }
    onFillLevelConsumed?.();
  }, [fillLevel, onFillLevelConsumed, meta?.qtyPrecision]);

  const submit = async () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    const quantity = Number(qty);
    if (!(quantity > 0)) {
      toast.error(t("trade.insufficient"));
      return;
    }
    const futuresSymbol = spotToFuturesInstId(symbol);
    setSubmitting(true);
    try {
      await FuturesService.placeOrder({
        symbol: futuresSymbol,
        side: side === "long" ? "buy" : "sell",
        posSide: side,
        type,
        price: type === "limit" ? Number(price) : null,
        quantity,
        leverage,
        marginMode,
      });
      toast.success(
        `${side === "long" ? t("trade.openLong") : t("trade.openShort")} · ${leverage}x`,
      );
      setQty("");
      void refreshFutures();
    } catch {
      toast.error(t("trade.insufficient"));
    } finally {
      setSubmitting(false);
    }
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
            onClick={() => void persistMarginMode(m)}
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
        onChange={(e) => void persistLeverage(Number(e.target.value))}
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
        {t("trade.available")}: {formatPrice(availableUsdt, 2, locale)} USDT
      </p>

      {isLoggedIn ? (
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
      ) : (
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-semibold text-white",
            side === "long" ? "bg-up hover:brightness-110" : "bg-down hover:brightness-110",
          )}
        >
          {t("trade.loginToTrade")}
        </button>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <div className="rounded border border-[var(--terminal-border)] p-2 text-[10px] text-muted">
        <p>
          {t("trade.markPrice")}:{" "}
          {formatPrice(markPrice, meta?.pricePrecision ?? 2, locale)}
        </p>
      </div>
    </div>
  );
}
