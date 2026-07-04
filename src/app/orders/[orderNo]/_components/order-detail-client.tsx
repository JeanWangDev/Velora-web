"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BillingService } from "@/services/billing-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { PaymentOrder } from "@/types/billing";
import {
  billingCycleLabel,
  formatOrderDateTime,
  formatUsdtAmount,
  isOrderPayable,
  orderStatusClass,
  orderStatusLabel,
} from "@/app/orders/_components/order-utils";

interface OrderDetailClientProps {
  orderNo: string;
}

export function OrderDetailClient({ orderNo }: OrderDetailClientProps) {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await BillingService.getOrder(orderNo);
      setOrder(result.order);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderNo, t, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    void load();
  }, [hydrated, load, user]);

  const handleCancel = async () => {
    if (!order || !isOrderPayable(order)) return;
    if (!window.confirm(t("orders.cancelConfirm"))) return;

    setCancelling(true);
    try {
      const result = await BillingService.cancelOrder(orderNo);
      setOrder(result.order);
      toast.success(t("orders.cancelSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckout = () => {
    if (!order || !isOrderPayable(order)) return;
    router.push(`/orders/${orderNo}/pay`);
  };

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-muted">
        {t("orders.loginRequired")}
      </div>
    );
  }

  if (loading && !order) {
    return <div className="px-4 py-16 text-sm text-muted">{t("orders.loading")}</div>;
  }

  if (!order) {
    return <div className="px-4 py-16 text-sm text-muted">{t("orders.notFound")}</div>;
  }

  const payable = isOrderPayable(order);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/orders" className="text-sm text-accent hover:underline">
        ← {t("orders.backToList")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">{t("orders.detailTitle")}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-medium text-foreground">{t("orders.productInfo")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("orders.productName")}</dt>
                <dd className="text-right font-medium text-foreground">{order.planName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("orders.productCycle")}</dt>
                <dd className="text-right text-foreground">
                  {billingCycleLabel(order.durationDays, t)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground">{t("orders.orderInfo")}</h2>
              {payable ? (
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-600 transition hover:bg-red-500/15 disabled:opacity-50 dark:text-red-400"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                >
                  {cancelling ? t("orders.cancelling") : t("orders.cancelOrder")}
                </button>
              ) : (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusClass(order)}`}
                >
                  {orderStatusLabel(order, t)}
                </span>
              )}
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("orders.orderNo")}</dt>
                <dd className="break-all text-right font-mono text-foreground">{order.orderNo}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("orders.orderAmount")}</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatUsdtAmount(order.amountUsdt)} {order.asset}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("orders.createdAt")}</dt>
                <dd className="text-right text-foreground">{formatOrderDateTime(order.createdAt)}</dd>
              </div>
              {order.paymentStatus === "completed" && order.paidAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("orders.paidAt")}</dt>
                  <dd className="text-right text-foreground">{formatOrderDateTime(order.paidAt)}</dd>
                </div>
              ) : null}
              {order.txHash ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("orders.txHash")}</dt>
                  <dd className="break-all text-right font-mono text-xs text-foreground">
                    {order.txHash}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {payable ? (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-medium text-foreground">{t("orders.paymentMethod")}</h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border-2 border-accent bg-accent/5 px-4 py-3 text-sm font-medium text-foreground">
                  USDT [{order.chain}]
                </div>
              </div>
            </div>
          ) : null}

          {order.paymentStatus === "completed" ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <div className="text-3xl text-emerald-500">✓</div>
              <p className="mt-2 font-medium text-foreground">{t("orders.paySuccessTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("orders.paySuccessHint")}</p>
            </div>
          ) : null}

          {!payable && order.paymentStatus !== "completed" ? (
            <div className="rounded-2xl border border-border bg-surface p-5 text-center">
              <p className="font-medium text-foreground">
                {order.paymentStatus === "cancelled"
                  ? t("orders.orderCancelled")
                  : t("orders.orderExpired")}
              </p>
              <p className="mt-1 text-sm text-muted">{t("orders.orderCancelledHint")}</p>
              <Link
                href="/vip"
                className="mt-4 inline-block rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
              >
                {t("orders.retry")}
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-medium text-foreground">{t("orders.orderTotal")}</h2>
          <p className="mt-3 text-sm text-muted">{order.planName}</p>
          <p className="mt-4 text-3xl font-semibold text-foreground">
            {formatUsdtAmount(order.amountUsdt)}{" "}
            <span className="text-base font-normal text-muted">{order.asset}</span>
          </p>
          {payable ? (
            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
              onClick={handleCheckout}
            >
              {t("orders.checkout")}
            </button>
          ) : (
            <Link
              href="/orders"
              className="mt-6 block w-full rounded-2xl border border-border px-4 py-3 text-center text-sm text-foreground transition hover:bg-background/60"
            >
              {t("orders.backToList")}
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
