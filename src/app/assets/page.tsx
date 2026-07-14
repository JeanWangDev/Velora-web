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
import { PlatformService } from "@/services/platform-service";
import { toast } from "@/services/toast";
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
  { key: "earn", zh: "赚币账户", en: "Earn" },
  { key: "margin", zh: "杠杆账户", en: "Margin" },
];

interface MarginLoan {
  id: number;
  currency: string;
  principal: number;
  interest: number;
  status: string;
}

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
  const [unifiedMode, setUnifiedMode] = useState<"classic" | "unified">("classic");
  const [equityUsd, setEquityUsd] = useState(0);
  const [unrealizedPnl, setUnrealizedPnl] = useState(0);
  const [marginLoans, setMarginLoans] = useState<MarginLoan[]>([]);
  const [marginLiability, setMarginLiability] = useState(0);
  const [borrowCurrency, setBorrowCurrency] = useState("USDT");
  const [borrowAmount, setBorrowAmount] = useState("");

  useEffect(() => {
    void useTradingStore.getState().hydrate();
    void PlatformService.getUnifiedMode()
      .then((r) => setUnifiedMode(r.mode))
      .catch(() => null);
    void PlatformService.getUnifiedEquity()
      .then((r) => {
        setEquityUsd(r.equityUsd);
        setUnrealizedPnl(r.unrealizedPnl);
        if (r.mode === "classic" || r.mode === "unified") setUnifiedMode(r.mode);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (tab !== "margin") return;
    void PlatformService.getMarginSummary()
      .then((r) => {
        setMarginLoans(r.loans as MarginLoan[]);
        setMarginLiability(r.totalLiability);
      })
      .catch(() => null);
  }, [tab]);

  const balances = getAccountBalances(tab);

  const totalUsd = useMemo(() => {
    const all = [
      ...balancesByAccount.funding,
      ...balancesByAccount.trading,
      ...balancesByAccount.futures,
      ...balancesByAccount.earn,
      ...balancesByAccount.margin,
    ];
    const seen = new Set<string>();
    return all.reduce((sum, b) => {
      const key = `${b.accountType}:${b.currency}`;
      if (seen.has(key)) return sum;
      seen.add(key);
      return sum + assetUsdValue(b.currency, b.available + b.frozen, tickers);
    }, 0);
  }, [balancesByAccount, tickers]);

  const toggleUnified = async () => {
    const next = unifiedMode === "classic" ? "unified" : "classic";
    try {
      await PlatformService.setUnifiedMode(next);
      setUnifiedMode(next);
      const eq = await PlatformService.getUnifiedEquity();
      setEquityUsd(eq.equityUsd);
      setUnrealizedPnl(eq.unrealizedPnl);
      toast.success(isZh ? "账户模式已切换" : "Account mode updated");
    } catch {
      toast.error(t("common.error"));
    }
  };

  const submitBorrow = async () => {
    const val = Number(borrowAmount);
    if (!(val > 0)) return;
    try {
      await PlatformService.borrowMargin(borrowCurrency, val);
      toast.success(isZh ? "借入成功" : "Borrowed");
      setBorrowAmount("");
      void useTradingStore.getState().refreshBalances();
      const r = await PlatformService.getMarginSummary();
      setMarginLoans(r.loans as MarginLoan[]);
      setMarginLiability(r.totalLiability);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const repayLoan = async (loanId: number) => {
    try {
      await PlatformService.repayMargin(loanId);
      toast.success(isZh ? "已还款" : "Repaid");
      void useTradingStore.getState().refreshBalances();
      const r = await PlatformService.getMarginSummary();
      setMarginLoans(r.loans as MarginLoan[]);
      setMarginLiability(r.totalLiability);
    } catch {
      toast.error(t("common.error"));
    }
  };

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
            <LocaleLink href="/quick-buy">
              <Button variant="secondary" className="gap-1.5">
                {t("trade.quickBuy")}
              </Button>
            </LocaleLink>
            <LocaleLink href="/earn">
              <Button variant="secondary" className="gap-1.5">
                {t("trade.redeemEarn")}
              </Button>
            </LocaleLink>
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
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/60 pt-4 text-sm">
          <div>
            <p className="text-xs text-muted">{isZh ? "统一账户权益" : "Unified equity"}</p>
            <p className="font-mono tabular-nums">≈ {formatCompact(equityUsd, locale)} USDT</p>
          </div>
          <div>
            <p className="text-xs text-muted">{isZh ? "未实现盈亏" : "Unrealized PnL"}</p>
            <p className={cn("font-mono tabular-nums", unrealizedPnl >= 0 ? "text-emerald-600" : "text-red-500")}>
              {formatCompact(unrealizedPnl, locale)} USDT
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleUnified()}
            className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            {isZh ? "模式：" : "Mode: "}
            {unifiedMode === "unified" ? (isZh ? "统一账户" : "Unified") : isZh ? "经典" : "Classic"}
          </button>
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

      {tab === "margin" ? (
        <div className="glass-panel mb-4 rounded-2xl p-4 text-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">{isZh ? "杠杆负债" : "Margin liability"}</h2>
            <span className="font-mono tabular-nums text-muted">
              {formatCompact(marginLiability, locale)} USDT
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              value={borrowCurrency}
              onChange={(e) => setBorrowCurrency(e.target.value.toUpperCase())}
              className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
            />
            <input
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder={isZh ? "借入数量" : "Borrow amount"}
              className="min-w-[120px] flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
            />
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => void submitBorrow()}>
              {isZh ? "借入" : "Borrow"}
            </Button>
          </div>
          {marginLoans.length === 0 ? (
            <p className="text-muted">{isZh ? "暂无借贷" : "No active loans"}</p>
          ) : (
            <ul className="space-y-2">
              {marginLoans.map((loan) => (
                <li key={loan.id} className="flex items-center justify-between rounded-lg bg-surface-muted/40 px-3 py-2">
                  <span className="font-mono text-xs">
                    {loan.currency} · {loan.principal} + {loan.interest} · {loan.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => void repayLoan(loan.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    {isZh ? "还款" : "Repay"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

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
