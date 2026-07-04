"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BillingService } from "@/services/billing-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { MembershipPlan, UserSubscription } from "@/types/billing";
import { useTranslation } from "@/i18n/use-translation";

function formatUsdt(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function VipPageClient() {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPlanKey, setCreatingPlanKey] = useState<string | null>(null);

  const isVip = (user?.roleLevel ?? 0) >= 2;

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const planResult = await BillingService.listPlans();
      setPlans(planResult.plans);

      if (user) {
        const subResult = await BillingService.getSubscription();
        setSubscription(subResult.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vip.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    if (!hydrated) return;
    void loadPage();
  }, [hydrated, loadPage]);

  const benefits = useMemo(
    () => [t("vip.benefitPairs"), t("vip.benefitTemplates"), t("vip.benefitRealtime")],
    [t],
  );

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      toast.error(t("vip.loginRequired"));
      return;
    }

    setCreatingPlanKey(planKey);
    try {
      const result = await BillingService.createOrder(planKey);
      router.push(`/orders/${result.order.orderNo}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vip.orderFailed"));
    } finally {
      setCreatingPlanKey(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-accent/80">{t("vip.eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t("vip.title")}</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">{t("vip.description")}</p>
        </div>
        {user ? (
          <Link href="/orders" className="text-sm text-accent hover:underline">
            {t("orders.myOrders")}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="text-sm text-muted">{t("vip.loading")}</div>
      ) : (
        <>
          {user ? (
            <div className="rounded-3xl border border-border bg-surface p-5 text-sm">
              <div className="font-medium text-foreground">{t("vip.currentStatus")}</div>
              <div className="mt-2 text-muted">
                {isVip
                  ? subscription
                    ? t("vip.activeUntil").replace("{date}", formatDateTime(subscription.endsAt))
                    : t("vip.roleVip")
                  : t("vip.roleFree")}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-5 text-sm text-muted">
              {t("vip.loginHint")}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.planKey}
                className="flex h-full flex-col rounded-3xl border border-border bg-surface p-6"
              >
                <div className="text-lg font-semibold text-foreground">{plan.name}</div>
                <div className="mt-2 text-3xl font-semibold text-accent">
                  {formatUsdt(plan.priceUsdt)} {plan.asset}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {plan.chain} · {plan.durationDays} {t("vip.days")}
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {benefits.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-6 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={creatingPlanKey === plan.planKey}
                  onClick={() => void handleSubscribe(plan.planKey)}
                >
                  {creatingPlanKey === plan.planKey ? t("vip.processing") : t("vip.subscribe")}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
