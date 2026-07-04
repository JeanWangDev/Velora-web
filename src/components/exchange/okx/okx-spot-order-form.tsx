"use client";

import { useEffect, useState } from "react";
import { ChevronDown, HelpCircle, MoreVertical, SlidersHorizontal } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { getSymbolMeta } from "@/mocks/exchange-data";
import type { OrderSide, OrderType } from "@/types/exchange";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";
import { OkxAmountSlider } from "@/components/exchange/okx/okx-amount-slider";

const ADVANCED_LABELS: Record<string, { zh: string; en: string }> = {
  tpsl: { zh: "止盈止损", en: "TP/SL" },
  trailing: { zh: "移动止盈止损", en: "Trailing Stop" },
  trigger: { zh: "计划委托", en: "Trigger" },
  advancedLimit: { zh: "高级限价委托", en: "Advanced Limit" },
  iceberg: { zh: "冰山策略", en: "Iceberg" },
  twap: { zh: "时间加权策略", en: "TWAP" },
};

export function OkxSpotOrderForm({
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
  const balances = useMockTradingStore((s) => s.balances);
  const placeOrder = useMockTradingStore((s) => s.placeOrder);

  const [panelTab, setPanelTab] = useState<"trade" | "tools">("trade");
  const [side, setSide] = useState<OrderSide>("buy");
  const [type, setType] = useState<OrderType>("limit");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedType, setAdvancedType] = useState("tpsl");
  const [price, setPrice] = useState(String(lastPrice));
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [pct, setPct] = useState(0);
  const [tpsl, setTpsl] = useState(false);

  useEffect(() => {
    setPrice(String(lastPrice));
  }, [lastPrice, symbol]);

  useEffect(() => {
    if (!fillLevel || fillLevel.price <= 0) return;
    setPrice(String(fillLevel.price));
    if (fillLevel.qty > 0) {
      const q = fillLevel.qty;
      setQty(q.toFixed(meta?.qtyPrecision ?? 4));
      setAmount((q * fillLevel.price).toFixed(2));
      setPct(0);
    }
    onFillLevelConsumed?.();
  }, [fillLevel, onFillLevelConsumed, meta?.qtyPrecision]);

  const quote = balances.find((b) => b.currency === meta?.quote);
  const base = balances.find((b) => b.currency === meta?.base);
  const available =
    side === "buy" ? (quote?.available ?? 0) : (base?.available ?? 0);
  const pr = type === "limit" ? Number(price) || lastPrice : lastPrice;

  const applyPct = (p: number) => {
    setPct(p);
    if (side === "buy") {
      const q = (available / pr) * (p / 100);
      setQty(q.toFixed(meta?.qtyPrecision ?? 4));
      setAmount((q * pr).toFixed(2));
    } else {
      const q = available * (p / 100);
      setQty(q.toFixed(meta?.qtyPrecision ?? 4));
      setAmount((q * pr).toFixed(2));
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
    setAmount("");
    setPct(0);
  };

  const maxLabel = side === "buy" ? t("trade.maxBuy") : t("trade.maxSell");
  const maxVal =
    side === "buy"
      ? `${((quote?.available ?? 0) / pr).toFixed(meta?.qtyPrecision ?? 4)} ${meta?.base}`
      : `${((base?.available ?? 0) * pr).toFixed(2)} ${meta?.quote}`;

  const inputCls =
    "w-full rounded border border-[var(--terminal-border)] bg-[#0a0a0a] px-2 py-2 font-mono text-sm tabular-nums outline-none focus:border-accent/50";

  if (panelTab === "tools") {
    return (
      <div className="flex min-h-0 flex-col text-xs">
        <PanelHeader
          panelTab={panelTab}
          setPanelTab={setPanelTab}
          t={t}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-muted">
          <p>{t("trade.toolsTab")}</p>
          <p className="text-[10px]">Mock · 计算器 / 网格等后续接入</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col text-xs">
      <PanelHeader panelTab={panelTab} setPanelTab={setPanelTab} t={t} />

      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-0.5 rounded bg-[#0a0a0a] p-0.5">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={cn(
                "py-2 text-sm font-medium transition",
                side === s
                  ? s === "buy"
                    ? "rounded bg-[#1a3d2a] text-up"
                    : "rounded bg-[#3d1a2a] text-down"
                  : "text-muted",
              )}
            >
              {t(`trade.${s}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--terminal-border)] pb-1">
          {(
            [
              { key: "limit" as const, label: t("trade.limitOrder") },
              { key: "market" as const, label: t("trade.marketOrder") },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setType(item.key)}
              className={cn(
                "pb-1 text-xs",
                type === item.key
                  ? "border-b-2 border-foreground font-medium text-foreground"
                  : "text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-foreground"
            >
              {ADVANCED_LABELS[advancedType]?.[locale === "zh" ? "zh" : "en"] ??
                t("trade.tpsl")}
              <ChevronDown className="h-3 w-3" />
            </button>
            {advancedOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded border border-[var(--terminal-border)] bg-[#141414] py-1 shadow-lg">
                {Object.entries(ADVANCED_LABELS).map(([key, labels]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={key === "iceberg"}
                    onClick={() => {
                      setAdvancedType(key);
                      setAdvancedOpen(false);
                    }}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs hover:bg-[#1c1c1c]",
                      key === advancedType && "bg-[#1c1c1c]",
                      key === "iceberg" && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {labels[locale === "zh" ? "zh" : "en"]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <HelpCircle className="h-3.5 w-3.5 text-muted" />
        </div>

        {type === "limit" && (
          <label className="block">
            <span className="text-muted">
              {t("trade.price")} ({meta?.quote})
            </span>
            <div className="mt-1 flex gap-1">
              <div className="relative flex-1">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputCls}
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                  ≈ ¥{formatPrice(Number(price) * 6.78, 1, locale)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrice(String(lastPrice))}
                className="shrink-0 rounded border border-[var(--terminal-border)] px-2 text-[10px] text-muted hover:text-foreground"
              >
                {t("trade.bestPrice")}
              </button>
            </div>
          </label>
        )}

        <label className="block">
          <span className="text-muted">
            {t("trade.quantity")} ({meta?.base})
          </span>
          <input
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              const q = Number(e.target.value);
              if (q > 0) setAmount((q * pr).toFixed(2));
            }}
            placeholder={`最小 ${meta?.minQty} ${meta?.base}`}
            className={cn(inputCls, "mt-1")}
          />
        </label>

        <OkxAmountSlider
          value={pct}
          onChange={applyPct}
          side={side}
        />

        <label className="block">
          <span className="text-muted">
            {t("trade.amount")} ({meta?.quote})
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn(inputCls, "mt-1")}
          />
        </label>

        <div className="space-y-1 text-[11px] text-muted">
          <div className="flex justify-between">
            <span>
              {t("trade.available")}{" "}
              {formatPrice(available, side === "buy" ? 2 : meta?.qtyPrecision ?? 4, locale)}{" "}
              {side === "buy" ? meta?.quote : meta?.base}
            </span>
            <button type="button" className="text-accent">
              +
            </button>
          </div>
          <div className="flex justify-between">
            <span>{maxLabel}</span>
            <span className="text-foreground">{maxVal}</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={tpsl}
            onChange={(e) => setTpsl(e.target.checked)}
            className="rounded border-[var(--terminal-border)]"
          />
          {t("trade.tpsl")}
        </label>

        <button
          type="button"
          onClick={submit}
          className={cn(
            "w-full rounded py-3 text-sm font-semibold text-white",
            side === "buy" ? "bg-[#1a5c38] hover:bg-[#1f7044]" : "bg-[#6b2340] hover:bg-[#7a2849]",
          )}
        >
          {side === "buy" ? t("trade.buy") : t("trade.sell")} {meta?.base}
        </button>

        <div className="flex justify-between text-[10px] text-muted">
          <span>
            {side === "buy" ? "最高买价" : "最低卖价"} ¥
            {formatPrice(lastPrice * 6.78 * (side === "buy" ? 1.004 : 0.996), 1, locale)}
          </span>
          <button type="button" className="hover:text-foreground">
            % {t("trade.feeRate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  panelTab,
  setPanelTab,
  t,
}: {
  panelTab: "trade" | "tools";
  setPanelTab: (v: "trade" | "tools") => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex shrink-0 items-center border-b border-[var(--terminal-border)] px-2">
      {(
        [
          { key: "trade" as const, label: t("trade.tradeTab") },
          { key: "tools" as const, label: t("trade.toolsTab") },
        ] as const
      ).map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setPanelTab(item.key)}
          className={cn(
            "px-2 py-2 text-xs",
            panelTab === item.key
              ? "border-b-2 border-foreground font-medium text-foreground"
              : "text-muted hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2 py-1 text-muted">
        <span className="text-[10px]">{t("trade.leverage")}</span>
        <div className="h-4 w-8 rounded-full bg-[#1c1c1c]" />
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <MoreVertical className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
