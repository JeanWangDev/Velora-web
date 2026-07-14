"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { PlatformService } from "@/services/platform-service";
import { toast } from "@/services/toast";

export default function QuickBuyPage() {
  const t = useExchangeT();
  const [fiatAmount, setFiatAmount] = useState("720");
  const [orderNo, setOrderNo] = useState("");
  const [pending, setPending] = useState(false);

  const createOrder = async () => {
    const amt = Number(fiatAmount);
    if (!(amt > 0)) return;
    setPending(true);
    try {
      const res = await PlatformService.createQuickBuyOrder(amt);
      setOrderNo(res.orderNo);
      toast.success(`Order ${res.orderNo} · ~${res.cryptoAmount} USDT`);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setPending(false);
    }
  };

  const confirm = async () => {
    if (!orderNo) return;
    try {
      const res = await PlatformService.confirmQuickBuy(orderNo);
      toast.success(`Credited ${(res as { credited: number }).credited} USDT`);
      setOrderNo("");
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="aurora-bg mx-auto max-w-md px-4 py-8">
      <Link href="/assets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">{t("trade.quickBuy")}</h1>
      <p className="mb-6 text-sm text-muted">{t("trade.quickBuyDesc")}</p>

      <div className="glass-panel space-y-4 rounded-2xl p-4">
        <label className="block text-sm">
          CNY Amount
          <input
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => void createOrder()}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Create payment order
        </button>
        {orderNo ? (
          <>
            <p className="text-xs text-muted">Order: {orderNo}</p>
            <button
              type="button"
              onClick={() => void confirm()}
              className="w-full rounded-full border border-accent py-2.5 text-sm font-semibold text-accent"
            >
              I have paid (demo confirm)
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
