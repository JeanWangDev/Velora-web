"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import {
  AccountService,
  type AccountType,
  type ServerLedgerEntry,
} from "@/services/account-service";
import type { LedgerType } from "@/types/exchange";
import { formatDateTime, formatPrice } from "@/utils/format-exchange";

const ACCOUNT_TYPES: AccountType[] = ["funding", "trading", "futures"];
const LEDGER_TYPES: LedgerType[] = [
  "deposit",
  "withdraw",
  "transfer",
  "trade",
  "fee",
  "freeze",
  "unfreeze",
  "credit",
];

function accountLabelKey(accountType: AccountType) {
  if (accountType === "funding") return "assets.accountFunding";
  if (accountType === "futures") return "assets.accountFutures";
  return "assets.accountTrading";
}

export default function AssetsHistoryPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [rows, setRows] = useState<ServerLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [type, setType] = useState<LedgerType | "">("");
  const [loading, setLoading] = useState(false);
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AccountService.getLedger({
        page,
        pageSize,
        currency: currency.trim() || undefined,
        accountType: accountType || undefined,
        type: type || undefined,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, currency, accountType, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="aurora-bg mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/assets"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("assets.historyTitle")}
      </h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("assets.filterCurrency")}
          <input
            value={currency}
            onChange={(e) => {
              setPage(1);
              setCurrency(e.target.value.toUpperCase());
            }}
            placeholder="USDT"
            className="h-9 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("assets.filterAccount")}
          <select
            value={accountType}
            onChange={(e) => {
              setPage(1);
              setAccountType(e.target.value as AccountType | "");
            }}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">{t("assets.filterAll")}</option>
            {ACCOUNT_TYPES.map((a) => (
              <option key={a} value={a}>
                {t(accountLabelKey(a))}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t("assets.filterType")}
          <select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value as LedgerType | "");
            }}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">{t("assets.filterAll")}</option>
            {LEDGER_TYPES.map((lt) => (
              <option key={lt} value={lt}>
                {t(`assets.types.${lt}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("assets.time")}</th>
              <th className="px-4 py-3 text-left">{t("assets.account")}</th>
              <th className="px-4 py-3 text-left">{t("assets.currency")}</th>
              <th className="px-4 py-3 text-left">{t("assets.type")}</th>
              <th className="px-4 py-3 text-right">{t("assets.amount")}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">
                {t("assets.ref")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  {t("common.loading")}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-border/60 transition hover:bg-surface-muted/40"
                >
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(e.ts, locale)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {e.accountType
                      ? t(accountLabelKey(e.accountType))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.currency}</td>
                  <td className="px-4 py-3">{t(`assets.types.${e.type}`)}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums ${
                      e.amount >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {e.amount >= 0 ? "+" : ""}
                    {formatPrice(e.amount, 8, locale)}
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted sm:table-cell">
                    {e.refId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            ←
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
