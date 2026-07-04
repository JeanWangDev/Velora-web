import type { PaymentOrder } from "@/types/billing";
import type { TranslationKey } from "@/i18n/use-translation";

export function formatOrderDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatOrderDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatUsdtAmount(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}

export function billingCycleLabel(
  durationDays: number | null,
  t: (key: TranslationKey) => string,
): string {
  if (!durationDays) return "—";
  if (durationDays >= 365) return t("orders.cycleYearly");
  if (durationDays >= 180) return t("orders.cycleSemiAnnual");
  if (durationDays >= 30) return t("orders.cycleMonthly");
  return t("orders.cycleDays").replace("{days}", String(durationDays));
}

export function orderStatusLabel(
  order: PaymentOrder,
  t: (key: TranslationKey) => string,
): string {
  if (order.paymentStatus === "completed") return t("orders.statusCompleted");
  if (order.paymentStatus === "pending") return t("orders.statusPending");
  return t("orders.statusCancelled");
}

export function orderStatusClass(order: PaymentOrder): string {
  if (order.paymentStatus === "completed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (order.paymentStatus === "pending") {
    return "border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "border border-border bg-muted/10 text-muted";
}

export function isOrderPayable(order: PaymentOrder): boolean {
  return order.paymentStatus === "pending" && order.expireAt > Date.now();
}
