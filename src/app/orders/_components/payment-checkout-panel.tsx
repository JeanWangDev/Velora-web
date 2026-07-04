"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaymentOrder } from "@/types/billing";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import { formatUsdtAmount } from "@/app/orders/_components/order-utils";

interface PaymentCheckoutPanelProps {
  order: PaymentOrder;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function useCountdown(expireAt: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = Math.max(0, expireAt - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
    expired: remainingMs <= 0,
  };
}

async function copyText(value: string, okMessage: string, failMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(okMessage);
  } catch {
    toast.error(failMessage);
  }
}

export function PaymentCheckoutPanel({ order }: PaymentCheckoutPanelProps) {
  const t = useTranslation();
  const countdown = useCountdown(order.expireAt);
  const displayAmount = useMemo(() => formatUsdtAmount(order.amountUsdt), [order.amountUsdt]);
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.depositAddress)}`,
    [order.depositAddress],
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl font-bold text-emerald-500">
          ₮
        </div>
        <p className="mt-5 text-sm text-muted">
          {t("orders.payOrderNo")}：{order.orderNo}
        </p>
        <p className="mt-3 text-sm text-muted">{t("orders.payNetworkHint")}</p>
        <p className="mt-2 text-sm font-medium text-red-500">{t("orders.payAmountWarning")}</p>
        <p className="mt-1 text-xs text-amber-500">{t("orders.payTapToCopy")}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <button
          type="button"
          className="w-full rounded-2xl border border-border bg-background/50 px-4 py-5 text-center transition hover:bg-background/80"
          onClick={() =>
            void copyText(displayAmount, t("orders.copiedAmount"), t("orders.copyFailed"))
          }
        >
          <div className="text-3xl font-semibold tracking-tight text-foreground">
            {displayAmount} {order.asset}
          </div>
        </button>

        <button
          type="button"
          className="mt-3 w-full break-all rounded-2xl border border-border bg-background/50 px-4 py-3 text-left font-mono text-xs text-foreground transition hover:bg-background/80"
          onClick={() =>
            void copyText(order.depositAddress, t("orders.copiedAddress"), t("orders.copyFailed"))
          }
        >
          {order.depositAddress}
        </button>

        <div className="mt-6 flex justify-center rounded-2xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="TRC20 deposit QR" width={220} height={220} className="rounded-lg" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-1 text-xs text-muted">
          <span>{t("orders.countdownHour")}</span>
          <span className="mx-2">{t("orders.countdownMinute")}</span>
          <span>{t("orders.countdownSecond")}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 font-mono text-3xl text-foreground">
          <span className="rounded-xl bg-background/70 px-4 py-2">{countdown.hours}</span>
          <span>:</span>
          <span className="rounded-xl bg-background/70 px-4 py-2">{countdown.minutes}</span>
          <span>:</span>
          <span className="rounded-xl bg-background/70 px-4 py-2">{countdown.seconds}</span>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">{t("orders.pollingHint")}</p>
    </div>
  );
}
