"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { useTranslation } from "@/i18n/use-translation";
import { AdminTradingPairsService } from "@/services/admin-trading-pairs-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { TradingPair } from "@/types/trading-pair";
import { isAdminUser } from "@/utils/admin";

type FormState = {
  baseAsset: string;
  symbol: string;
  exchange: string;
  displayName: string;
  sortOrder: string;
  isDefault: boolean;
  status: "0" | "1";
};

const emptyForm = (): FormState => ({
  baseAsset: "",
  symbol: "",
  exchange: "binance",
  displayName: "",
  sortOrder: "100",
  isDefault: false,
  status: "1",
});

function formFromPair(pair: TradingPair): FormState {
  return {
    baseAsset: pair.baseAsset,
    symbol: pair.symbol,
    exchange: pair.exchange,
    displayName: pair.displayName,
    sortOrder: String(pair.sortOrder),
    isDefault: pair.isDefault,
    status: pair.status === 1 ? "1" : "0",
  };
}

export function AdminSymbolsClient() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [items, setItems] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TradingPair | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TradingPair | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isAdmin = isAdminUser(user);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await AdminTradingPairsService.list();
      setItems(res.data);
    } catch (error) {
      setItems([]);
      toast.error(error instanceof Error ? error.message : t("adminSymbols.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, t]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (pair: TradingPair) => {
    setEditing(pair);
    setForm(formFromPair(pair));
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (!form.baseAsset.trim() || !form.symbol.trim()) return;
    if (!Number.isFinite(sortOrder)) return;

    const payload = {
      baseAsset: form.baseAsset.trim(),
      symbol: form.symbol.trim(),
      exchange: form.exchange.trim() || "binance",
      displayName: form.displayName.trim(),
      sortOrder,
      isDefault: form.isDefault,
      status: Number(form.status) as 0 | 1,
    };

    setSubmitting(true);
    try {
      if (editing) {
        const updated = await AdminTradingPairsService.update(editing.id, payload);
        setItems((prev) => prev.map((item) => (item.id === editing.id ? updated : item)));
        toast.success(t("adminSymbols.saved"));
      } else {
        const created = await AdminTradingPairsService.create(payload);
        setItems((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
        toast.success(t("adminSymbols.created"));
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editing
            ? t("adminSymbols.saveFailed")
            : t("adminSymbols.createFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncSpot = async () => {
    setSyncing(true);
    try {
      const res = await AdminTradingPairsService.syncSpotFromBinance();
      toast.success(`已从 Binance 同步 ${res.synced} 个现货交易对`);
      if (res.failed.length > 0) {
        toast.info(`部分失败：${res.failed.slice(0, 3).join("；")}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    setRemoveSubmitting(true);
    try {
      await AdminTradingPairsService.remove(removeTarget.id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === removeTarget.id ? { ...item, status: 0, isDefault: false } : item,
        ),
      );
      toast.success(t("adminSymbols.removed"));
      setRemoveTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminSymbols.removeFailed"));
    } finally {
      setRemoveSubmitting(false);
    }
  };

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
        <p className="text-sm text-muted">{t("adminSymbols.loginRequired")}</p>
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
        <p className="text-sm text-muted">{t("adminSymbols.forbidden")}</p>
        <p className="text-xs text-muted">{t("adminSymbols.forbiddenHint")}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          {t("nav.home")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("adminSymbols.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("adminSymbols.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleSyncSpot()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-60"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            从 Binance 同步现货
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("adminSymbols.create")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted">
          {t("adminSymbols.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colSymbol")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colBase")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colName")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colExchange")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colSort")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colDefault")}</th>
                <th className="px-4 py-3 font-medium">{t("adminSymbols.colStatus")}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((pair) => (
                <tr key={pair.id} className={pair.status === 0 ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium text-foreground">{pair.symbol}</td>
                  <td className="px-4 py-3 text-muted">{pair.baseAsset}</td>
                  <td className="px-4 py-3 text-muted">{pair.displayName}</td>
                  <td className="px-4 py-3 text-muted">{pair.exchange}</td>
                  <td className="px-4 py-3 text-muted">{pair.sortOrder}</td>
                  <td className="px-4 py-3 text-muted">
                    {pair.isDefault ? t("adminSymbols.yes") : t("adminSymbols.no")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {pair.status === 1
                      ? t("adminSymbols.statusActive")
                      : t("adminSymbols.statusDisabled")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(pair)}
                        className="rounded border border-border px-2 py-1 text-xs hover:border-accent/40"
                      >
                        {t("adminSymbols.edit")}
                      </button>
                      {pair.status === 1 ? (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(pair)}
                          className="rounded border border-border px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/5"
                        >
                          {t("adminSymbols.remove")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t("adminSymbols.formEditTitle") : t("adminSymbols.formCreateTitle")}
        panelClassName="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-muted">
              {t("adminSymbols.fieldBaseAsset")}
              <input
                value={form.baseAsset}
                onChange={(e) => setForm((f) => ({ ...f, baseAsset: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              {t("adminSymbols.fieldSymbol")}
              <input
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-muted">
            {t("adminSymbols.fieldDisplayName")}
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-muted">
              {t("adminSymbols.fieldExchange")}
              <input
                value={form.exchange}
                onChange={(e) => setForm((f) => ({ ...f, exchange: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-muted">
              {t("adminSymbols.fieldSortOrder")}
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            {t("adminSymbols.fieldIsDefault")}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-muted">
              {t("adminSymbols.fieldStatus")}
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "0" | "1" }))}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <option value="1">{t("adminSymbols.statusActive")}</option>
                <option value="0">{t("adminSymbols.statusDisabled")}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setFormOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            {t("adminSymbols.cancel")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("adminSymbols.confirm")}
          </button>
        </div>
      </AppModal>

      <ConfirmModal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={t("adminSymbols.remove")}
        message={t("adminSymbols.removeConfirm")}
        confirmLabel={t("adminSymbols.remove")}
        cancelLabel={t("adminSymbols.cancel")}
        onConfirm={confirmRemove}
        danger
        submitting={removeSubmitting}
      />
    </div>
  );
}
