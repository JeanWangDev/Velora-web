"use client";

import { isChineseLocale } from "@/i18n/locale-helpers";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowLeftRight, ArrowUpFromLine, Wallet } from "lucide-react";
import { LocaleLink } from "@/components/ui/locale-link";
import { Button } from "@/components/ui/button";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useRequireKyc } from "@/hooks/use-require-kyc";
import { useLocale } from "@/i18n/use-translation";
import { useMarketStore } from "@/stores/use-market-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { formatCompact, formatPrice } from "@/utils/format-exchange";
import type { AccountType } from "@/types/exchange";
import { cn } from "@/lib/cn";
import {
  DepositModal,
  TransferModal,
  WithdrawModal,
} from "@/components/exchange/okx/okx-wallet-modals";

const STABLE = new Set(["USDT", "USDC", "USD"]);

const TABS: { key: AccountType; zh: string; en: string }[] = [
  { key: "funding", zh: "资金账户", en: "Funding" },
  { key: "trading", zh: "交易账户", en: "Trading" },
  { key: "futures", zh: "合约账户", en: "Futures" },
];

function assetUsdValue(
  currency: string,
  total: number,
  tickers: ReturnType<typeof useMarketStore.getState>["tickers"],
): number {
  if (STABLE.has(currency)) return total;
  const pair = `${currency}-USDT`;
  const last = tickers[pair]?.last;
  if (last) return total * last;
  return 0;
}

export default function AssetsPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = isChineseLocale(locale);
  const balancesByAccount = useTradingStore((s) => s.balancesByAccount);
  const getAccountBalances = useTradingStore((s) => s.getAccountBalances);
  const tickers = useMarketStore((s) => s.tickers);
  const { status, verified, ensureKyc } = useRequireKyc();

  const [tab, setTab] = useState<AccountType>("funding");
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    void useTradingStore.getState().hydrate();
  }, []);

  const balances = getAccountBalances(tab);

  const totalUsd = useMemo(() => {
    const all = [...balancesByAccount.funding, ...balancesByAccount.trading, ...balancesByAccount.futures];
    const seen = new Set<string>();
    return all.reduce((sum, b) => {
      const key = `${b.accountType}:${b.currency}`;
      if (seen.has(key)) return sum;
      seen.add(key);
      return sum + assetUsdValue(b.currency, b.available + b.frozen, tickers);
    }, 0);
  }, [balancesByAccount, tickers]);

  const tabUsd = useMemo(() => {
    return balances.reduce(
      (sum, b) => sum + assetUsdValue(b.currency, b.available + b.frozen, tickers),
      0,
    );
  }, [balances, tickers]);

  const rows = [...balances].sort((a, b) => {
    const va = assetUsdValue(a.currency, a.available + a.frozen, tickers);
    const vb = assetUsdValue(b.currency, b.available + b.frozen, tickers);
    return vb - va;
  });

  return (
    <div className="aurora-bg mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("assets.title")}</h1>
          <p className="mt-1 text-sm text-muted">Velora · OKX 多账户资产</p>
        </div>
        <LocaleLink
          href="/assets/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-primary/40 hover:text-primary"
        >
          {t("assets.history")}
          <ArrowRight className="h-4 w-4" />
        </LocaleLink>
      </div>

      {!verified ? (
        <div
          className={cn(
            "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
            status === "pending"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-primary/30 bg-primary/10",
          )}
        >
          <p>{isZh ? "完成 KYC 后可提现" : "Complete KYC to withdraw"}</p>
          <LocaleLink href="/user/kyc" className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary">
            {t("user.kycGoVerify")}
          </LocaleLink>
        </div>
      ) : null}

      <div className="glass-panel mb-6 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted">{t("assets.total")}</p>
              <p className="text-3xl font-semibold tabular-nums">
                ≈ {formatCompact(totalUsd, locale)} <span className="text-lg text-muted">USDT</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="gap-1.5" onClick={() => setDepositOpen(true)}>
              <ArrowDownToLine className="h-4 w-4" />
              {t("assets.deposit")}
            </Button>
            <Button variant="secondary" className="gap-1.5" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="h-4 w-4" />
              {isZh ? "划转" : "Transfer"}
            </Button>
            <Button className="gap-1.5" onClick={() => (ensureKyc() ? setWithdrawOpen(true) : null)}>
              <ArrowUpFromLine className="h-4 w-4" />
              {t("assets.withdraw")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface-muted/40 p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
              tab === item.key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {isZh ? item.zh : item.en}
            <span className="ml-1 text-xs text-muted">
              ≈{formatCompact(tabUsd, locale)}
            </span>
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("assets.currency")}</th>
              <th className="px-4 py-3 text-right">{t("assets.available")}</th>
              <th className="px-4 py-3 text-right">{t("assets.frozen")}</th>
              <th className="px-4 py-3 text-right">{t("assets.totalCol")}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">≈ USDT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {tab === "trading"
                    ? isZh
                      ? "交易账户暂无余额，请从资金账户划转"
                      : "No trading balance — transfer from funding"
                    : isZh
                      ? "暂无资产"
                      : "No assets"}
                </td>
              </tr>
            ) : (
              rows.map((b) => {
                const total = b.available + b.frozen;
                const usd = assetUsdValue(b.currency, total, tickers);
                return (
                  <tr key={b.currency} className="border-t border-border/60 hover:bg-surface-muted/40">
                    <td className="px-4 py-3 font-medium">{b.currency}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatPrice(b.available, 8, locale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted">
                      {formatPrice(b.frozen, 8, locale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatPrice(total, 8, locale)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-muted sm:table-cell">
                      {formatCompact(usd, locale)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
