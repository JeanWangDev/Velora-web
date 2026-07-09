"use client";

import { useEffect, useMemo } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Gift,
  Shield,
  Wallet,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { LocaleLink } from "@/components/ui/locale-link";
import { Button } from "@/components/ui/button";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useAuthStore } from "@/stores/use-auth-store";
import { useKycStore } from "@/stores/use-kyc-store";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { maskEmail } from "@/utils/mask-email";
import { formatCompact } from "@/utils/format-exchange";
import { cn } from "@/lib/cn";

const STABLE = new Set(["USDT", "USDC"]);

function assetUsdValue(
  currency: string,
  amount: number,
  tickers: ReturnType<typeof useMockMarketStore.getState>["tickers"],
) {
  if (STABLE.has(currency)) return amount;
  return amount * (tickers[`${currency}-USDT`]?.last ?? 0);
}

export default function UserOverviewPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const user = useAuthStore((s) => s.user)!;
  const kycStatus = useKycStore((s) => s.status);
  const balances = useTradingStore((s) => s.balances);
  const tickers = useMockMarketStore((s) => s.tickers);

  useEffect(() => {
    void useTradingStore.getState().hydrate();
  }, []);

  const totalUsd = useMemo(() => {
    return balances.reduce((sum, b) => {
      const amount = b.available + b.frozen;
      return sum + assetUsdValue(b.currency, amount, tickers);
    }, 0);
  }, [balances, tickers]);

  const kycLabel = useMemo(() => {
    if (kycStatus === "verified") return t("user.kycStatusVerified");
    if (kycStatus === "pending") return t("user.kycStatusPending");
    if (kycStatus === "rejected") return t("user.kycStatusRejected");
    return t("user.kycStatusNone");
  }, [kycStatus, t]);

  const securityScore = kycStatus === "verified" ? 2 : 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("user.overview")}
      </h1>

      {/* 资料卡 — OKX 风格 */}
      <section className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar nickname={user.nickname} className="h-14 w-14 text-lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-medium">{maskEmail(user.email)}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    kycStatus === "verified"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : kycStatus === "pending"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-orange-500/15 text-orange-700 dark:text-orange-400",
                  )}
                >
                  {kycLabel}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted">
                UID {user.id.replace(/^mock-/, "").slice(0, 12) || user.id}
              </p>
            </div>
          </div>
          <LocaleLink
            href="/user/security"
            className="text-sm text-primary hover:underline"
          >
            {t("user.viewProfile")}
          </LocaleLink>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{t("assets.total")}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {formatCompact(totalUsd, locale)} USDT
            </p>
          </div>
          <LocaleLink
            href="/assets"
            className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary"
          >
            {t("assets.title")}
            <ArrowRight className="h-4 w-4" />
          </LocaleLink>
        </div>
      </section>

      {/* KYC Banner — 未认证时展示 */}
      {kycStatus !== "verified" ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-surface via-surface to-primary/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("user.kycBannerTitle")}</h2>
                <p className="mt-1 max-w-md text-sm text-muted">
                  {t("user.kycBannerDesc")}
                </p>
              </div>
            </div>
            <LocaleLink href="/user/kyc">
              <Button className="min-w-[120px] gap-1">
                {t("user.verifyNow")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </LocaleLink>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 快捷入口 */}
        <section className="glass-panel space-y-1 rounded-2xl p-2 lg:col-span-2">
          <QuickRow
            href="/user/kyc"
            icon={BadgeCheck}
            title={t("user.kyc")}
            desc={kycLabel}
            badge={kycStatus !== "verified" ? kycLabel : undefined}
          />
          <QuickRow
            href="/user/security"
            icon={Shield}
            title={t("user.security")}
            desc={t("user.securityHint")}
          />
          <QuickRow
            href="/assets"
            icon={Wallet}
            title={t("assets.title")}
            desc={isZh ? "查看余额与充提" : "Balances & transfers"}
          />
        </section>

        {/* 安全进度 — OKX 侧栏简化版 */}
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-medium">{t("user.protectAccount")}</h2>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-surface-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeDasharray={`${(securityScore / 5) * 97.4} 97.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-semibold tabular-nums">
                {securityScore}/5
              </span>
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              {t("user.securityLevelLow")}
            </p>
            <LocaleLink
              href="/user/security"
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              {t("user.boostSecurity")}
            </LocaleLink>
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickRow({
  href,
  icon: Icon,
  title,
  desc,
  badge,
}: {
  href: string;
  icon: typeof Shield;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <LocaleLink
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-surface-muted/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted">{desc}</p>
      </div>
      {badge ? (
        <span className="hidden rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] text-orange-700 dark:text-orange-400 sm:inline">
          {badge}
        </span>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </LocaleLink>
  );
}
