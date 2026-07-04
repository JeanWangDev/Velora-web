"use client";

import { useCallback, useEffect, useState } from "react";
import { CreatorService } from "@/services/creator-service";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";

function formatUsdt(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function CreatorEarningsPanel() {
  const t = useTranslation();
  const [available, setAvailable] = useState("0");
  const [pending, setPending] = useState("0");
  const [lifetime, setLifetime] = useState("0");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CreatorService.getBalance();
      setAvailable(data.availableUsdt);
      setPending(data.pendingUsdt);
      setLifetime(data.lifetimeEarnedUsdt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.earningsLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await CreatorService.withdraw({
        amountUsdt: Number(amount),
        address: address.trim(),
        chain: "TRC20",
      });
      toast.success(t("strategies.withdrawSubmitted"));
      setAmount("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.withdrawFailed"));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">{t("strategies.loading")}</p>;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-medium text-foreground">{t("strategies.earningsTitle")}</h3>
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-xs text-muted">{t("strategies.earningsAvailable")}</div>
          <div className="text-lg font-semibold text-foreground">{formatUsdt(available)} USDT</div>
        </div>
        <div>
          <div className="text-xs text-muted">{t("strategies.earningsPending")}</div>
          <div className="text-lg font-semibold text-foreground">{formatUsdt(pending)} USDT</div>
        </div>
        <div>
          <div className="text-xs text-muted">{t("strategies.earningsLifetime")}</div>
          <div className="text-lg font-semibold text-foreground">{formatUsdt(lifetime)} USDT</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder={t("strategies.withdrawAmount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder={t("strategies.withdrawAddress")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          type="button"
          className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
          disabled={withdrawing}
          onClick={() => void handleWithdraw()}
        >
          {t("strategies.withdraw")}
        </button>
      </div>
    </div>
  );
}
