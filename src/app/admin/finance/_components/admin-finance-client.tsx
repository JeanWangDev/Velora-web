"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Minus, Plus, Search, ShieldAlert } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import {
  AdminFinanceService,
  type AdminFinanceOp,
  type AdminUserBalances,
} from "@/services/admin-finance-service";
import { AdminUsersService } from "@/services/admin-users-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { AdminUser } from "@/types/admin-user";
import { isAdminUser } from "@/utils/admin";

function formatTime(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ts));
}

export function AdminFinanceClient() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAdmin = isAdminUser(user);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ops, setOps] = useState<AdminFinanceOp[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterType, setFilterType] = useState<"" | "credit" | "debit">("");

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userBalances, setUserBalances] = useState<AdminUserBalances | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);

  const [form, setForm] = useState({
    currency: "USDT",
    amount: "",
    remark: "",
    mode: "credit" as "credit" | "debit",
  });
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 20;

  const loadOps = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await AdminFinanceService.listOps({
        page,
        pageSize,
        targetUserId: filterUserId ? Number(filterUserId) : undefined,
        currency: filterCurrency || undefined,
        type: filterType || undefined,
      });
      setOps(res.data);
      setTotal(res.total);
    } catch (error) {
      setOps([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : t("adminFinance.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, filterUserId, filterCurrency, filterType, t]);

  useEffect(() => {
    if (!hydrated) return;
    void loadOps();
  }, [hydrated, loadOps]);

  const searchUsers = async () => {
    const q = userSearch.trim();
    if (!q) return;
    try {
      const res = await AdminUsersService.list({ page: 1, pageSize: 10, query: q });
      setUserResults(res.data);
    } catch {
      setUserResults([]);
    }
  };

  const loadUserBalances = async (userId: number) => {
    setBalancesLoading(true);
    try {
      const res = await AdminFinanceService.getUserBalances(userId);
      setUserBalances(res);
    } catch (error) {
      setUserBalances(null);
      toast.error(error instanceof Error ? error.message : t("adminFinance.balanceFailed"));
    } finally {
      setBalancesLoading(false);
    }
  };

  const selectUser = (u: AdminUser) => {
    setSelectedUser(u);
    setUserResults([]);
    setUserSearch(u.email);
    void loadUserBalances(u.id);
  };

  const submitOp = async () => {
    if (!selectedUser) {
      toast.error(t("adminFinance.selectUserFirst"));
      return;
    }
    const amount = Number(form.amount);
    if (!(amount > 0)) {
      toast.error(t("adminFinance.amountInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        userId: selectedUser.id,
        currency: form.currency.trim().toUpperCase(),
        amount,
        remark: form.remark.trim() || undefined,
      };
      if (form.mode === "credit") {
        await AdminFinanceService.credit(body);
        toast.success(t("adminFinance.creditSuccess"));
      } else {
        await AdminFinanceService.debit(body);
        toast.success(t("adminFinance.debitSuccess"));
      }
      setForm((f) => ({ ...f, amount: "", remark: "" }));
      void loadUserBalances(selectedUser.id);
      setPage(1);
      void loadOps();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminFinance.opFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!hydrated) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm text-muted">{t("adminFinance.loginRequired")}</p>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          {t("site.login")}
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-500" />
        <p className="text-sm text-muted">{t("adminFinance.forbidden")}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("adminFinance.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("adminFinance.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 操作表单 */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{t("adminFinance.formTitle")}</h2>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-muted">
              {t("adminFinance.targetUser")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void searchUsers()}
                  placeholder={t("adminFinance.userSearchPlaceholder")}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
                />
                {userResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {userResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                      >
                        <span className="font-medium">{u.email}</span>
                        <span className="ml-2 text-xs text-muted">ID {u.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => void searchUsers()}
                className="rounded-lg border border-border px-3 text-sm hover:border-accent/40"
              >
                {t("adminFinance.search")}
              </button>
            </div>
            {selectedUser ? (
              <p className="mt-2 text-xs text-muted">
                {t("adminFinance.selected")}: {selectedUser.email} (ID {selectedUser.id})
              </p>
            ) : null}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["credit", "debit"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode }))}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                  form.mode === mode
                    ? mode === "credit"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-rose-500/15 text-rose-600"
                    : "border border-border text-muted hover:text-foreground"
                }`}
              >
                {mode === "credit" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {t(`adminFinance.mode.${mode}`)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-muted">
              {t("adminFinance.currency")}
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              {t("adminFinance.amount")}
              <input
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="1000"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              {t("adminFinance.remark")}
              <input
                value={form.remark}
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                placeholder={t("adminFinance.remarkPlaceholder")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={submitting || !selectedUser}
            onClick={() => void submitOp()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {form.mode === "credit"
              ? t("adminFinance.submitCredit")
              : t("adminFinance.submitDebit")}
          </button>
        </section>

        {/* 用户资产 */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">{t("adminFinance.balancesTitle")}</h2>
          {balancesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : !userBalances ? (
            <p className="py-10 text-center text-sm text-muted">{t("adminFinance.balancesEmpty")}</p>
          ) : (
            <>
              <p className="mb-3 text-sm">
                <span className="font-medium">{userBalances.email}</span>
                <span className="ml-2 text-muted">ID {userBalances.userId}</span>
              </p>
              {userBalances.balances.length === 0 ? (
                <p className="text-sm text-muted">{t("adminFinance.noBalances")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-xs text-muted">
                    <tr>
                      <th className="py-2 text-left">{t("adminFinance.colCurrency")}</th>
                      <th className="py-2 text-right">{t("adminFinance.colAvailable")}</th>
                      <th className="py-2 text-right">{t("adminFinance.colFrozen")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBalances.balances.map((b) => (
                      <tr key={b.currency} className="border-t border-border/60">
                        <td className="py-2 font-medium">{b.currency}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{b.available}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-muted">
                          {b.frozen}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>
      </div>

      {/* 操作记录 */}
      <section className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
          <h2 className="mr-auto text-sm font-semibold">{t("adminFinance.opsTitle")}</h2>
          <input
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder={t("adminFinance.filterUserId")}
            className="w-28 rounded border border-border bg-background px-2 py-1.5 text-xs"
          />
          <input
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            placeholder={t("adminFinance.filterCurrency")}
            className="w-24 rounded border border-border bg-background px-2 py-1.5 text-xs uppercase"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "" | "credit" | "debit")}
            className="rounded border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="">{t("adminFinance.filterAllTypes")}</option>
            <option value="credit">{t("adminFinance.mode.credit")}</option>
            <option value="debit">{t("adminFinance.mode.debit")}</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              void loadOps();
            }}
            className="rounded border border-border px-3 py-1.5 text-xs hover:border-accent/40"
          >
            {t("adminFinance.filterApply")}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted" />
          </div>
        ) : ops.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">{t("adminFinance.opsEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colTime")}</th>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colOpNo")}</th>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colType")}</th>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colTarget")}</th>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colOperator")}</th>
                  <th className="px-4 py-3 text-right">{t("adminFinance.colAmount")}</th>
                  <th className="px-4 py-3 text-left">{t("adminFinance.colRemark")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ops.map((op) => (
                  <tr key={op.opNo}>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatTime(op.ts, locale)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{op.opNo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          op.type === "credit" ? "text-emerald-600" : "text-rose-600"
                        }
                      >
                        {t(`adminFinance.mode.${op.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div>{op.targetEmail}</div>
                        <div className="text-muted">ID {op.targetUserId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{op.operatorEmail}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${
                        op.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {op.amount >= 0 ? "+" : ""}
                      {op.amount} {op.currency}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs text-muted">
                      {op.remark || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted">
            <span>{t("adminFinance.total").replace("{total}", String(total))}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border px-3 py-1 disabled:opacity-40"
              >
                {t("adminFinance.prev")}
              </button>
              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-40"
              >
                {t("adminFinance.next")}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
