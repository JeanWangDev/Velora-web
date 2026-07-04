"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BillingService } from "@/services/billing-service";
import { PaymentCheckoutPanel } from "@/app/orders/_components/payment-checkout-panel";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { PaymentOrder } from "@/types/billing";
import { isOrderPayable } from "@/app/orders/_components/order-utils";

interface OrderPayClientProps {
  orderNo: string;
}

export function OrderPayClient({ orderNo }: OrderPayClientProps) {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const result = await BillingService.getOrder(orderNo);
      setOrder(result.order);
      return result.order;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.loadFailed"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderNo, t, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    void load();
  }, [hydrated, load, user]);

  useEffect(() => {
    if (!order || !isOrderPayable(order)) return;

    const timer = setInterval(async () => {
      try {
        const result = await BillingService.getOrder(orderNo);
        setOrder(result.order);

        if (result.order.paymentStatus === "completed") {
          toast.success(t("orders.paySuccess"));
          router.replace(`/orders/${orderNo}`);
        } else if (
          result.order.paymentStatus === "expired" ||
          result.order.paymentStatus === "cancelled"
        ) {
          toast.error(t("orders.orderCancelled"));
          router.replace(`/orders/${orderNo}`);
        }
      } catch {
        /* polling */
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [order, orderNo, router, t]);

  useEffect(() => {
    if (!order || isOrderPayable(order)) return;
    router.replace(`/orders/${orderNo}`);
  }, [order, orderNo, router]);

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted">
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

  if (!isOrderPayable(order)) {
    return <div className="px-4 py-16 text-sm text-muted">{t("orders.loading")}</div>;
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href={`/orders/${orderNo}`}
        className="text-sm text-accent hover:underline"
      >
        ← {t("orders.backToDetail")}
      </Link>
      <h1 className="mt-3 text-center text-xl font-semibold text-foreground">
        {t("orders.payTitle")}
      </h1>
      <div className="mt-8">
        <PaymentCheckoutPanel order={order} />
      </div>
    </section>
  );
}
