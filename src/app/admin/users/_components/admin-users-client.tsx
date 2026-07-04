"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search, ShieldAlert } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppModal } from "@/components/ui/app-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import { AdminUsersService } from "@/services/admin-users-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { AdminUser } from "@/types/admin-user";
import type { RoleKey, RoleOption } from "@/types/auth";
import { isAdminUser } from "@/utils/admin";

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

export function AdminUsersClient() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    nickname: "",
    roleKey: "normal_user" as RoleKey,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [disableTarget, setDisableTarget] = useState<AdminUser | null>(null);
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<number | null>(null);

  const pageSize = 20;
  const isAdmin = isAdminUser(user);

  const loadRoles = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await AdminUsersService.listRoles();
      setRoles(res.data);
    } catch {
      setRoles([]);
    }
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await AdminUsersService.list({ page, pageSize, query });
      setItems(res.data);
      setTotal(res.total);
    } catch (error) {
      setItems([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : t("adminUsers.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, query, t]);

  useEffect(() => {
    if (!hydrated) return;
    void loadRoles();
  }, [hydrated, loadRoles]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const handleRoleChange = async (target: AdminUser, roleKey: RoleKey) => {
    if (target.roleKey === roleKey) return;

    setRoleUpdatingId(target.id);
    try {
      const updated = await AdminUsersService.updateRole(target.id, roleKey);
      setItems((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      toast.success(t("adminUsers.roleUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminUsers.roleFailed"));
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleEnable = async (target: AdminUser) => {
    try {
      const updated = await AdminUsersService.updateStatus(target.id, 1);
      setItems((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      toast.success(t("adminUsers.enabled"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminUsers.statusFailed"));
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) return;

    setDisableSubmitting(true);
    try {
      const updated = await AdminUsersService.updateStatus(disableTarget.id, 0);
      setItems((prev) => prev.map((item) => (item.id === disableTarget.id ? updated : item)));
      toast.success(t("adminUsers.disabled"));
      setDisableTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminUsers.statusFailed"));
    } finally {
      setDisableSubmitting(false);
    }
  };

  const handleCreate = async () => {
    setCreateSubmitting(true);
    try {
      await AdminUsersService.create({
        email: createForm.email.trim(),
        password: createForm.password,
        nickname: createForm.nickname.trim() || undefined,
        roleKey: createForm.roleKey,
      });
      toast.success(t("adminUsers.created"));
      setCreateOpen(false);
      setCreateForm({ email: "", password: "", nickname: "", roleKey: "normal_user" });
      setPage(1);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminUsers.createFailed"));
    } finally {
      setCreateSubmitting(false);
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
        <p className="text-sm text-muted">{t("adminUsers.loginRequired")}</p>
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
        <p className="text-sm text-muted">{t("adminUsers.forbidden")}</p>
        <p className="text-xs text-muted">{t("adminUsers.forbiddenHint")}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AdminNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("adminUsers.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("adminUsers.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t("adminUsers.create")}
        </button>
      </div>

      <form
        className="relative max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(searchInput.trim());
          setPage(1);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("adminUsers.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-accent"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
          {t("adminUsers.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colNickname")}</th>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colRole")}</th>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colLevel")}</th>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("adminUsers.colLastLogin")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((row) => (
                <tr key={row.id} className={row.status === 0 ? "opacity-60" : ""}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.email}</td>
                  <td className="px-4 py-3 text-muted">{row.nickname}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.roleKey}
                      disabled={roleUpdatingId === row.id}
                      onChange={(e) =>
                        void handleRoleChange(row, e.target.value as RoleKey)
                      }
                      className="max-w-[140px] rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {roles.map((role) => (
                        <option key={role.roleKey} value={role.roleKey}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      Lv.{row.roleLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.status === 1
                      ? t("adminUsers.statusActive")
                      : t("adminUsers.statusDisabled")}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatTime(row.lastLoginTime, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 1 ? (
                      <button
                        type="button"
                        onClick={() => setDisableTarget(row)}
                        className="rounded border border-border px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/5"
                      >
                        {t("adminUsers.disable")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleEnable(row)}
                        className="rounded border border-border px-2 py-1 text-xs hover:border-accent/40"
                      >
                        {t("adminUsers.enable")}
                      </button>
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
          <span>{t("adminUsers.total").replace("{total}", String(total))}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              {t("adminUsers.prev")}
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
              {t("adminUsers.next")}
            </button>
          </div>
        </div>
      ) : null}

      <AppModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("adminUsers.formCreateTitle")}
        panelClassName="max-w-md"
      >
        <div className="space-y-4">
          <label className="block text-xs font-medium text-muted">
            {t("adminUsers.fieldEmail")}
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            {t("adminUsers.fieldPassword")}
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-[11px] text-muted">{t("adminUsers.passwordHint")}</span>
          </label>
          <label className="block text-xs font-medium text-muted">
            {t("adminUsers.fieldNickname")}
            <input
              value={createForm.nickname}
              onChange={(e) => setCreateForm((f) => ({ ...f, nickname: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            {t("adminUsers.fieldRole")}
            <select
              value={createForm.roleKey}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, roleKey: e.target.value as RoleKey }))
              }
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            >
              {roles.map((role) => (
                <option key={role.roleKey} value={role.roleKey}>
                  {role.roleName} (Lv.{role.roleLevel})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={createSubmitting}
            onClick={() => setCreateOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            {t("adminUsers.cancel")}
          </button>
          <button
            type="button"
            disabled={createSubmitting}
            onClick={() => void handleCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("adminUsers.confirm")}
          </button>
        </div>
      </AppModal>

      <ConfirmModal
        open={disableTarget !== null}
        onClose={() => setDisableTarget(null)}
        title={t("adminUsers.disable")}
        message={t("adminUsers.disableConfirm")}
        confirmLabel={t("adminUsers.disable")}
        cancelLabel={t("adminUsers.cancel")}
        onConfirm={confirmDisable}
        danger
        submitting={disableSubmitting}
      />
    </div>
  );
}
