"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppModal } from "@/components/ui/app-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import {
  KycService,
  type AdminKycStatusFilter,
  type AdminKycVerification,
} from "@/services/kyc-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import { isAdminUser } from "@/utils/admin";

type StatusTab = "all" | AdminKycStatusFilter;

function formatTime(ts: number | null, locale: string): string {
  if (!ts) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function AdminKycClient() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [items, setItems] = useState<AdminKycVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<StatusTab>("pending");
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<AdminKycVerification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminKycVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 20;
  const isAdmin = isAdminUser(user);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await KycService.adminList({
        page,
        pageSize,
        status: tab === "all" ? undefined : tab,
      });
      setItems(res.data);
      setTotal(res.total);
    } catch (error) {
      setItems([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : t("adminKyc.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, tab, t]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const statusLabel = useCallback(
    (status: AdminKycVerification["status"]) => {
      if (status === "verified") return t("adminKyc.statusVerified");
      if (status === "rejected") return t("adminKyc.statusRejected");
      return t("adminKyc.statusPending");
    },
    [t],
  );

  const statusClass = (status: AdminKycVerification["status"]) => {
    if (status === "verified") return "bg-emerald-500/10 text-emerald-600";
    if (status === "rejected") return "bg-rose-500/10 text-rose-600";
    return "bg-amber-500/10 text-amber-600";
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await KycService.review(approveTarget.userId, "approve");
      toast.success(t("adminKyc.approved"));
      setApproveTarget(null);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminKyc.reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await KycService.review(rejectTarget.userId, "reject", rejectReason.trim() || undefined);
      toast.success(t("adminKyc.rejected"));
      setRejectTarget(null);
      setRejectReason("");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminKyc.reviewFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "pending", label: t("adminKyc.filterPending") },
    { key: "verified", label: t("adminKyc.filterVerified") },
    { key: "rejected", label: t("adminKyc.filterRejected") },
    { key: "all", label: t("adminKyc.filterAll") },
  ];

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
        <p className="text-sm text-muted">{t("adminKyc.loginRequired")}</p>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
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
        <p className="text-sm text-muted">{t("adminKyc.forbidden")}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AdminNav />

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("adminKyc.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("adminKyc.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === item.key
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
          {t("adminKyc.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colUser")}</th>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colName")}</th>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colType")}</th>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colIdNumber")}</th>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("adminKyc.colSubmitted")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-3 text-muted">{row.email ?? `#${row.userId}`}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.fullName}</td>
                  <td className="px-4 py-3 text-muted">
                    {row.idType === "passport" ? t("adminKyc.passport") : t("adminKyc.idCard")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.idNumber}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatTime(row.submittedAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApproveTarget(row)}
                          className="rounded border border-border px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/5"
                        >
                          {t("adminKyc.approve")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(row);
                            setRejectReason("");
                          }}
                          className="rounded border border-border px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/5"
                        >
                          {t("adminKyc.reject")}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>{t("adminKyc.total").replace("{total}", String(total))}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              {t("adminKyc.prev")}
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
              {t("adminKyc.next")}
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        title={t("adminKyc.approve")}
        message={t("adminKyc.approveConfirm")}
        confirmLabel={t("adminKyc.approve")}
        cancelLabel={locale === "en" ? "Cancel" : "取消"}
        onConfirm={confirmApprove}
        submitting={submitting}
      />

      <AppModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title={t("adminKyc.reject")}
        panelClassName="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">{t("adminKyc.rejectConfirm")}</p>
          <label className="block text-xs font-medium text-muted">
            {t("adminKyc.rejectReason")}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={t("adminKyc.rejectReasonPh")}
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setRejectTarget(null)}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            {locale === "en" ? "Cancel" : "取消"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void confirmReject()}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("adminKyc.reject")}
          </button>
        </div>
      </AppModal>
    </div>
  );
}
