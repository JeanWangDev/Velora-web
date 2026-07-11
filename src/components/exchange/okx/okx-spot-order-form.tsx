"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, HelpCircle, Menu, SlidersHorizontal } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useTradingStore } from "@/stores/use-trading-store";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import type { OrderSide } from "@/types/exchange";
import { formatPrice } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { SpotService } from "@/services/spot-service";
import { cn } from "@/lib/cn";
import { OkxAmountSlider } from "@/components/exchange/okx/okx-amount-slider";
import { DepositMethodModal } from "@/components/exchange/okx/deposit-method-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";

type FormMode = "limit" | "market" | "tpsl";

/** OKX 风格分段输入框：左侧标签 | 输入 | 单位 | 步进 */
function OkxInputRow({
  value,
  onChange,
  placeholder,
  unit,
  label,
  readOnly,
  steppers,
  onStep,
  className,
  badge,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  unit?: string;
  label?: string;
  readOnly?: boolean;
  steppers?: boolean;
  onStep?: (delta: number) => void;
  className?: string;
  badge?: string;
}) {
  const segment =
    "flex shrink-0 items-center border-l border-[var(--terminal-border-strong)] bg-[var(--terminal-panel-2)]";

  return (
    <div
      className={cn(
        "flex h-10 min-w-0 overflow-hidden rounded-lg border border-[var(--terminal-border-strong)] bg-[var(--terminal-panel)]",
        className,
      )}
    >
      {label && (
        <div
          className={cn(
            segment,
            "border-l-0 border-r border-[var(--terminal-border-strong)] px-2.5 text-[11px] text-[var(--terminal-muted)]",
          )}
        >
          {label}
        </div>
      )}
      {badge && (
        <div className="flex shrink-0 items-center px-2">
          <span className="rounded border border-[var(--terminal-border-strong)] bg-[var(--terminal-panel-2)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--terminal-text)]">
            {badge}
          </span>
        </div>
      )}
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-right font-mono text-xs tabular-nums text-[var(--terminal-text)] outline-none placeholder:text-[var(--terminal-muted)]"
      />
      {unit && (
        <div className={cn(segment, "px-2.5 text-[11px] text-[var(--terminal-muted)]")}>
          {unit}
        </div>
      )}
      {steppers && onStep && (
        <div className="flex w-5 shrink-0 flex-col border-l border-[var(--terminal-border-strong)]">
          <button
            type="button"
            onClick={() => onStep(1)}
            className="flex flex-1 items-center justify-center border-b border-[var(--terminal-border-strong)] text-[var(--terminal-muted)] transition hover:bg-[var(--terminal-panel-2)] hover:text-[var(--terminal-text)]"
          >
            <ChevronUp className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="flex flex-1 items-center justify-center text-[var(--terminal-muted)] transition hover:bg-[var(--terminal-panel-2)] hover:text-[var(--terminal-text)]"
          >
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** 最优价：独立按钮，在价格输入框右侧 */
function OkxBestPriceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 shrink-0 items-center justify-center rounded-lg border border-[var(--terminal-border-strong)] bg-[var(--terminal-panel)] px-2.5 text-[10px] text-[var(--terminal-muted)] transition hover:border-[var(--terminal-accent)] hover:text-[var(--terminal-text)]"
    >
      {label}
    </button>
  );
}

function OkxSideForm({
  symbol,
  lastPrice,
  side,
  mode,
  fillLevel,
  onAddFunds,
  isLoggedIn,
  onLoginClick,
}: {
  symbol: string;
  lastPrice: number;
  side: OrderSide;
  mode: FormMode;
  fillLevel?: { price: number; qty: number } | null;
  onAddFunds?: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  const meta = getSymbolMeta(symbol);
  const balances = useTradingStore((s) => s.balances);
  const placeOrder = useTradingStore((s) => s.placeOrder);
  const [submitting, setSubmitting] = useState(false);

  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [pct, setPct] = useState(0);
  const [attachTpsl, setAttachTpsl] = useState(false);
  const [triggerPrice, setTriggerPrice] = useState("");
  const [tpslMode, setTpslMode] = useState<"one" | "two">("one");
  const [tpslOpen, setTpslOpen] = useState(false);

  const quote = balances.find((b) => b.currency === meta?.quote);
  const base = balances.find((b) => b.currency === meta?.base);
  const available =
    side === "buy" ? (quote?.available ?? 0) : (base?.available ?? 0);
  const pr = mode === "limit" ? Number(price) || lastPrice : lastPrice;
  const isBuy = side === "buy";
  const pricePrecision = meta?.pricePrecision ?? 2;
  const qtyPrecision = meta?.qtyPrecision ?? 4;
  const minQty = meta?.minQty ?? 0.01;

  // 仅切换币对 / 委托类型时重置表单；行情跳动不应清空用户输入
  useEffect(() => {
    setPrice(lastPrice.toFixed(pricePrecision));
    setTriggerPrice(lastPrice.toFixed(pricePrecision));
    setQty("");
    setAmount("");
    setPct(0);
  }, [symbol, pricePrecision, mode]);

  useEffect(() => {
    if (!fillLevel || fillLevel.price <= 0) return;
    setPrice(fillLevel.price.toFixed(pricePrecision));
    setTriggerPrice(fillLevel.price.toFixed(pricePrecision));
    if (fillLevel.qty > 0) {
      const q = fillLevel.qty;
      setQty(q.toFixed(qtyPrecision));
      setAmount((q * fillLevel.price).toFixed(2));
      setPct(0);
    }
  }, [fillLevel, pricePrecision, qtyPrecision]);

  const applyPct = (p: number) => {
    setPct(p);
    if (mode === "market" && isBuy) {
      const a = available * (p / 100);
      setAmount(a.toFixed(2));
      setQty((a / lastPrice).toFixed(qtyPrecision));
      return;
    }
    if (side === "buy") {
      const q = (available / pr) * (p / 100);
      setQty(q.toFixed(qtyPrecision));
      setAmount((q * pr).toFixed(2));
    } else {
      const q = available * (p / 100);
      setQty(q.toFixed(qtyPrecision));
      setAmount((q * pr).toFixed(2));
    }
  };

  const stepTrigger = (delta: number) => {
    const step = Math.pow(10, -pricePrecision);
    const next = Math.max(0, (Number(triggerPrice) || lastPrice) + delta * step);
    setTriggerPrice(next.toFixed(pricePrecision));
  };

  const stepPrice = (delta: number) => {
    const step = Math.pow(10, -pricePrecision);
    const next = Math.max(0, (Number(price) || lastPrice) + delta * step);
    setPrice(next.toFixed(pricePrecision));
    const q = Number(qty);
    if (q > 0) setAmount((q * next).toFixed(2));
  };

  const submit = async () => {
    if (submitting) return;

    if (mode === "tpsl") {
      const quantity = Number(qty);
      const trigger = Number(triggerPrice);
      if (!(quantity > 0) || !(trigger > 0)) {
        toast.error(t("trade.insufficient"));
        return;
      }
      const algoType =
        side === "sell"
          ? trigger < lastPrice
            ? "stop_loss"
            : "take_profit"
          : trigger > lastPrice
            ? "take_profit"
            : "stop_loss";
      setSubmitting(true);
      try {
        await SpotService.placeAlgoOrder({
          symbol,
          side,
          algoType,
          triggerPrice: trigger,
          orderPrice: price ? Number(price) : null,
          quantity,
        });
        toast.success(t("trade.tpslOrderPlaced"));
        setQty("");
        setTriggerPrice("");
        setPrice("");
      } catch {
        toast.error(t("trade.insufficient"));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    let quantity = Number(qty);
    if (mode === "market" && isBuy) {
      quantity = Number(amount) / lastPrice;
    }
    if (!(quantity > 0)) {
      toast.error(t("trade.insufficient"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeOrder({
        symbol,
        side,
        type: mode === "limit" ? "limit" : "market",
        price: mode === "limit" ? Number(price) : null,
        quantity,
      });
      if (!result.ok) {
        toast.error(result.message ?? t("trade.insufficient"));
        return;
      }
      toast.success(t("trade.orderPlaced"));
      setQty("");
      setAmount("");
      setPct(0);
    } finally {
      setSubmitting(false);
    }
  };

  const maxLabel = isBuy ? t("trade.maxBuy") : t("trade.maxSell");
  const maxVal =
    isBuy
      ? `${((quote?.available ?? 0) / pr).toFixed(qtyPrecision)} ${meta?.base}`
      : `${((base?.available ?? 0) * pr).toFixed(2)} ${meta?.quote}`;

  const refPrice = isBuy
    ? lastPrice * 1.004
    : lastPrice * 0.996;

  const minQtyPh =
    locale === "zh"
      ? `${t("trade.minQuantity")} ${minQty} ${meta?.base}`
      : `Min ${minQty} ${meta?.base}`;

  return (
    <div className="flex min-w-0 flex-col gap-2 p-2.5">
      {/* 限价 */}
      {mode === "limit" && (
        <>
          <div className="flex items-center gap-1.5">
            <OkxInputRow
              className="flex-1"
              label={t("trade.price")}
              value={price}
              onChange={setPrice}
              unit={meta?.quote}
              steppers
              onStep={stepPrice}
            />
            <OkxBestPriceButton
              label={t("trade.bestPrice")}
              onClick={() => setPrice(lastPrice.toFixed(pricePrecision))}
            />
          </div>
          <OkxInputRow
            label={t("trade.quantity")}
            value={qty}
            badge={pct > 0 ? `${pct}%` : undefined}
            onChange={(v) => {
              setQty(v);
              setPct(0);
              const q = Number(v);
              if (q > 0) setAmount((q * pr).toFixed(2));
            }}
            placeholder={minQtyPh}
            unit={meta?.base}
          />
        </>
      )}

      {/* 市价：买入金额 / 卖出数量 */}
      {mode === "market" && (
        <OkxInputRow
          value={isBuy ? amount : qty}
          onChange={(v) => {
            if (isBuy) {
              setAmount(v);
              const a = Number(v);
              if (a > 0) setQty((a / lastPrice).toFixed(qtyPrecision));
            } else {
              setQty(v);
            }
          }}
          label={isBuy ? t("trade.amount") : t("trade.quantity")}
          placeholder={isBuy ? undefined : minQtyPh}
          unit={isBuy ? meta?.quote : meta?.base}
        />
      )}

      {/* 止盈止损 */}
      {mode === "tpsl" && (
        <>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTpslOpen((v) => !v)}
              className="flex h-9 w-full items-center justify-between rounded-lg border border-[var(--terminal-border)] bg-[var(--terminal-panel)] px-2.5 text-[11px] text-[var(--terminal-muted)]"
            >
              <span>{locale === "zh" ? "单向/双向" : "Mode"}</span>
              <span className="flex items-center gap-1 text-[var(--terminal-text)]">
                {tpslMode === "one" ? t("trade.oneWay") : t("trade.twoWay")}
                <ChevronDown className="h-3 w-3" />
              </span>
            </button>
            {tpslOpen && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-[var(--terminal-border)] bg-[var(--terminal-bg)] py-1 shadow-lg">
                {(["one", "two"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setTpslMode(m); setTpslOpen(false); }}
                    className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--terminal-panel)]"
                  >
                    {m === "one" ? t("trade.oneWay") : t("trade.twoWay")}
                  </button>
                ))}
              </div>
            )}
          </div>
          <OkxInputRow
            label={t("trade.triggerPrice")}
            value={triggerPrice}
            onChange={setTriggerPrice}
            unit={meta?.quote}
            steppers
            onStep={stepTrigger}
          />
          <OkxInputRow
            label={t("trade.marketOrder")}
            value=""
            readOnly
            placeholder={t("trade.marketPriceLabel")}
          />
          <OkxInputRow
            value={isBuy ? amount : qty}
            onChange={(v) => (isBuy ? setAmount(v) : setQty(v))}
            label={isBuy ? t("trade.amount") : t("trade.quantity")}
            placeholder={isBuy ? undefined : minQtyPh}
            unit={isBuy ? meta?.quote : meta?.base}
          />
        </>
      )}

      <OkxAmountSlider value={pct} onChange={applyPct} side={side} />

      {/* 限价：数量 + 金额 */}
      {mode === "limit" && (
        <>
          <OkxInputRow
            value={amount}
            onChange={setAmount}
            label={t("trade.amount")}
            unit={meta?.quote}
          />
        </>
      )}

      {/* 可用 / 可买可卖 */}
      <div className="space-y-1 text-[10px] text-[var(--terminal-muted)]">
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-0.5">
            {t("trade.available")}
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-[var(--terminal-text)]">
              {formatPrice(available, isBuy ? 2 : qtyPrecision, locale)}{" "}
              {isBuy ? meta?.quote : meta?.base}
            </span>
          </span>
          <button
            type="button"
            onClick={onAddFunds}
            aria-label={t("trade.depositMethodTitle")}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--terminal-border-strong)] text-[11px] leading-none text-[var(--terminal-muted)] transition hover:border-[var(--terminal-accent)] hover:text-[var(--terminal-accent)]"
          >
            +
          </button>
        </div>
        <div className="flex justify-between gap-1">
          <span>{maxLabel}</span>
          <span className="font-mono text-[var(--terminal-text)]">{maxVal}</span>
        </div>
      </div>

      {/* 限价附加止盈止损 */}
      {mode === "limit" && (
        <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-[var(--terminal-muted)]">
          <input
            type="checkbox"
            checked={attachTpsl}
            onChange={(e) => setAttachTpsl(e.target.checked)}
            className="rounded border-[var(--terminal-border)]"
          />
          <span className="border-b border-dashed border-[var(--terminal-muted)]">
            {t("trade.tpslShort")}
          </span>
        </label>
      )}

      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className={cn(
            "w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-60",
            isBuy ? "bg-up hover:brightness-110" : "bg-down hover:brightness-110",
          )}
        >
          {t(`trade.${side}`)} {meta?.base}
        </button>
      ) : (
        <button
          type="button"
          onClick={onLoginClick}
          className={cn(
            "w-full rounded-full py-2.5 text-sm font-semibold text-white",
            isBuy ? "bg-up hover:brightness-110" : "bg-down hover:brightness-110",
          )}
        >
          {t("trade.loginToTrade")}
        </button>
      )}

      <div className="flex items-center justify-between text-[10px] text-[var(--terminal-muted)]">
        <span>
          {isBuy ? t("trade.highestBuyPrice") : t("trade.lowestSellPrice")}{" "}
          <span className="font-mono text-[var(--terminal-text)]">
            ¥{formatPrice(refPrice * 6.78, 1, locale)}
          </span>
        </span>
        {isBuy && (
          <button type="button" className="border-b border-dashed border-[var(--terminal-muted)] hover:text-[var(--terminal-text)]">
            % {t("trade.feeRate")}
          </button>
        )}
      </div>
    </div>
  );
}

export function OkxSpotOrderForm({
  symbol,
  lastPrice,
  fillLevel,
  onFillLevelConsumed,
  variant = "dual",
}: {
  symbol: string;
  lastPrice: number;
  fillLevel?: { price: number; qty: number } | null;
  onFillLevelConsumed?: () => void;
  variant?: "dual" | "pro";
}) {
  const t = useExchangeT();
  const [mode, setMode] = useState<FormMode>("limit");
  const [side, setSide] = useState<OrderSide>("buy");
  const [workspaceTab, setWorkspaceTab] = useState<"trade" | "tools">("trade");
  const [leverageOn, setLeverageOn] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(user);

  useEffect(() => {
    if (!fillLevel) return;
    onFillLevelConsumed?.();
  }, [fillLevel, onFillLevelConsumed]);

  const tabs: { key: FormMode; label: string }[] = [
    { key: "limit", label: t("trade.limitOrder") },
    { key: "market", label: t("trade.marketOrder") },
    { key: "tpsl", label: t("trade.tpsl") },
  ];

  if (variant === "pro") {
    return (
      <div className="flex min-h-0 flex-col text-xs">
        <div className="flex shrink-0 items-center gap-4 border-b border-[var(--terminal-border)] px-3 py-2">
          {(["trade", "tools"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setWorkspaceTab(key)}
              className={cn(
                "text-xs transition",
                workspaceTab === key
                  ? "border-b-2 border-[var(--terminal-text)] pb-0.5 font-medium text-[var(--terminal-text)]"
                  : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {key === "trade" ? t("trade.tradeTab") : t("trade.toolsTab")}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 text-[10px] text-[var(--terminal-muted)]">
              <span>{t("trade.leverage")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={leverageOn}
                onClick={() => setLeverageOn((v) => !v)}
                className={cn(
                  "relative h-4 w-7 rounded-full transition",
                  leverageOn ? "bg-[var(--terminal-accent)]" : "bg-[var(--terminal-border-strong)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white transition",
                    leverageOn ? "left-3.5" : "left-0.5",
                  )}
                />
              </button>
            </label>
            <button type="button" className="text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]">
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {workspaceTab === "trade" ? (
          <>
            <div className="grid shrink-0 grid-cols-2 gap-1 p-2">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-semibold transition",
                    side === s
                      ? s === "buy"
                        ? "bg-up text-white"
                        : "bg-down text-white"
                      : "bg-[var(--terminal-panel-2)] text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
                  )}
                >
                  {t(`trade.${s}`)}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-4 border-b border-[var(--terminal-border)] px-3">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "inline-flex items-center gap-0.5 py-2 text-xs transition",
                    mode === item.key
                      ? "border-b-2 border-[var(--terminal-text)] font-medium text-[var(--terminal-text)]"
                      : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
                  )}
                >
                  {item.label}
                  {item.key === "tpsl" && <ChevronDown className="h-3 w-3 opacity-60" />}
                </button>
              ))}
              <HelpCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--terminal-muted)]" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <OkxSideForm
                symbol={symbol}
                lastPrice={lastPrice}
                side={side}
                mode={mode}
                fillLevel={fillLevel}
                onAddFunds={() => setDepositOpen(true)}
                isLoggedIn={isLoggedIn}
                onLoginClick={() => setLoginOpen(true)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-[var(--terminal-muted)]">
            {t("common.comingSoon")}
          </div>
        )}

        <DepositMethodModal open={depositOpen} onClose={() => setDepositOpen(false)} />
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col text-xs">
      <div className="flex shrink-0 items-center border-b border-[var(--terminal-border)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--terminal-text)]">
          {t("trade.tradeTab")}
        </span>
        <HelpCircle className="ml-auto h-3.5 w-3.5 text-[var(--terminal-muted)]" />
      </div>

      {/* 委托类型 Tab：限价 / 市价 / 止盈止损 */}
      <div className="flex shrink-0 items-center gap-4 border-b border-[var(--terminal-border)] px-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={cn(
              "inline-flex items-center gap-0.5 py-2 text-xs transition",
              mode === item.key
                ? "border-b-2 border-[var(--terminal-text)] font-medium text-[var(--terminal-text)]"
                : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
            )}
          >
            {item.label}
            {item.key === "tpsl" && <ChevronDown className="h-3 w-3 opacity-60" />}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-[var(--terminal-border)]">
        <OkxSideForm
          symbol={symbol}
          lastPrice={lastPrice}
          side="buy"
          mode={mode}
          fillLevel={fillLevel}
          onAddFunds={() => setDepositOpen(true)}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setLoginOpen(true)}
        />
        <OkxSideForm
          symbol={symbol}
          lastPrice={lastPrice}
          side="sell"
          mode={mode}
          fillLevel={fillLevel}
          onAddFunds={() => setDepositOpen(true)}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setLoginOpen(true)}
        />
      </div>

      <DepositMethodModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
