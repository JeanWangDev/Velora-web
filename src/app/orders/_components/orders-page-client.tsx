"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BillingService } from "@/services/billing-service";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { PaymentOrder } from "@/types/billing";
import type { TranslationKey } from "@/i18n/use-translation";
import {
  billingCycleLabel,
  formatOrderDate,
  formatUsdtAmount,
  orderStatusClass,
  orderStatusLabel,
} from "@/app/orders/_components/order-utils";

function OrderRow({
  order,
  t,
}: {
  order: PaymentOrder;
  t: (key: TranslationKey) => string;
}) {
  return (
    <Link
      href={`/orders/${order.orderNo}`}
      className="grid grid-cols-1 gap-3 border-b border-border px-4 py-4 transition last:border-b-0 hover:bg-background/40 sm:grid-cols-[minmax(0,1fr)_72px_100px_88px_88px] sm:items-center sm:gap-4 sm:px-5"
    >
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{order.planName}</div>
        <div className="mt-1 truncate font-mono text-xs text-muted">#{order.orderNo}</div>
      </div>
      <div className="text-sm text-muted sm:text-center">
        <span className="sm:hidden text-xs">{t("orders.colCycle")}: </span>
        {billingCycleLabel(order.durationDays, t)}
      </div>
      <div className="text-sm font-medium text-foreground sm:text-center">
        <span className="sm:hidden text-xs font-normal text-muted">{t("orders.colAmount")}: </span>
        {formatUsdtAmount(order.amountUsdt)} {order.asset}
      </div>
      <div className="sm:text-center">
        <span
          className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${orderStatusClass(order)}`}
        >
          {orderStatusLabel(order, t)}
        </span>
      </div>
      <div className="text-sm text-muted sm:text-right">
        <span className="sm:hidden text-xs">{t("orders.colDate")}: </span>
        {formatOrderDate(order.createdAt)}
      </div>
    </Link>
  );
}

export function OrdersPageClient() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.paymentStatus === "pending").length,
    [orders],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await BillingService.listOrders();
      setOrders(result.orders);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    void load();
  }, [hydrated, load, user]);

  useEffect(() => {
    if (!user || pendingCount === 0) return;
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load, pendingCount, user]);

  if (!hydrated) return null;

  if (!user) {
    return (
      <>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <p className="text-sm text-muted">{t("orders.loginRequired")}</p>
          <button
            type="button"
            className="mt-4 rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
            onClick={() => setLoginOpen(true)}
          >
            {t("site.login")}
          </button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("orders.title")}</h1>
        <Link href="/vip" className="text-sm text-accent hover:underline">
          {t("orders.newOrder")}
        </Link>
      </div>

      {pendingCount > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t("orders.pendingHint").replace("{count}", String(pendingCount))}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">{t("orders.loading")}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
          <p className="text-sm text-muted">{t("orders.empty")}</p>
          <Link
            href="/vip"
            className="mt-4 inline-block rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            {t("orders.newOrder")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="hidden border-b border-border bg-background/50 px-5 py-3 text-xs text-muted sm:grid sm:grid-cols-[minmax(0,1fr)_72px_100px_88px_88px] sm:gap-4">
            <span>{t("orders.colProduct")}</span>
            <span className="text-center">{t("orders.colCycle")}</span>
            <span className="text-center">{t("orders.colAmount")}</span>
            <span className="text-center">{t("orders.colStatus")}</span>
            <span className="text-right">{t("orders.colDate")}</span>
          </div>
          <div>
            {orders.map((order) => (
              <OrderRow key={order.orderNo} order={order} t={t} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs leading-5 text-muted">{t("orders.orderNoHint")}</p>
    </section>
  );
}
