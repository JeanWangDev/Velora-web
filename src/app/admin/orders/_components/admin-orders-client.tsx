"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { LoginModal } from "@/components/auth/login-modal";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import { AdminBillingOrdersService } from "@/services/admin-billing-orders-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { AdminBillingOrder } from "@/services/admin-billing-orders-service";
import { isAdminUser } from "@/utils/admin";

function formatTime(ts: number | null, locale: string): string {
  if (!ts) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ts));
}

export function AdminOrdersClient() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [items, setItems] = useState<AdminBillingOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AdminBillingOrdersService.list({ page, pageSize: 20, query: query || undefined });
      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminOrders.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, query, t]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return;
    if (!isAdminUser(user)) return;
    void load();
  }, [hydrated, load, user]);

  if (!hydrated) return null;

  if (!user) {
    return (
      <>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-muted">{t("adminOrders.loginRequired")}</p>
          <button type="button" className="mt-4 text-accent underline" onClick={() => setLoginOpen(true)}>
            {t("site.login")}
          </button>
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  if (!isAdminUser(user)) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-16 text-muted">
        <ShieldAlert className="h-5 w-5" />
        {t("adminOrders.forbidden")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminNav />
      <h1 className="text-2xl font-semibold text-foreground">{t("adminOrders.title")}</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(searchInput.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm"
            placeholder={t("adminOrders.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground">
          {t("adminOrders.search")}
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("adminOrders.loading")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-muted">
              <tr>
                <th className="px-4 py-3">{t("adminOrders.colOrderNo")}</th>
                <th className="px-4 py-3">{t("adminOrders.colUser")}</th>
                <th className="px-4 py-3">{t("adminOrders.colAmount")}</th>
                <th className="px-4 py-3">{t("adminOrders.colStatus")}</th>
                <th className="px-4 py-3">{t("adminOrders.colTime")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.orderNo} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono text-xs">{row.orderNo}</td>
                  <td className="px-4 py-3">{row.userEmail || row.userId}</td>
                  <td className="px-4 py-3">
                    {row.amountUsdt} USDT
                  </td>
                  <td className="px-4 py-3">{row.paymentStatus}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatTime(row.paidAt ?? row.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted">
        <span>{t("adminOrders.total").replace("{total}", String(total))}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("adminOrders.prev")}
          </button>
          <button
            type="button"
            disabled={page * 20 >= total}
            className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            {t("adminOrders.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
