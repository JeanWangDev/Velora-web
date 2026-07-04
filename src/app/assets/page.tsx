"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useMockTradingStore } from "@/stores/use-mock-trading-store";
import { formatCompact, formatPrice } from "@/utils/format-exchange";

const STABLE = new Set(["USDT", "USDC", "USD"]);

function assetUsdValue(
  currency: string,
  total: number,
  tickers: ReturnType<typeof useMockMarketStore.getState>["tickers"],
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
  const balances = useMockTradingStore((s) => s.balances);
  const tickers = useMockMarketStore((s) => s.tickers);

  const totalUsd = useMemo(() => {
    return balances.reduce((sum, b) => {
      const total = b.available + b.frozen;
      return sum + assetUsdValue(b.currency, total, tickers);
    }, 0);
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
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("assets.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">Velora · Spot Ledger</p>
        </div>
        <Link
          href="/assets/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-primary/40 hover:text-primary"
        >
          {t("assets.history")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="glass-panel mb-6 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted">{t("assets.total")}</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight">
              ≈ {formatCompact(totalUsd, locale)}{" "}
              <span className="text-lg text-muted">USDT</span>
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">{t("assets.currency")}</th>
              <th className="px-4 py-3 text-right">{t("assets.available")}</th>
              <th className="px-4 py-3 text-right">{t("assets.frozen")}</th>
              <th className="px-4 py-3 text-right">{t("assets.totalCol")}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">
                ≈ USDT
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const total = b.available + b.frozen;
              const usd = assetUsdValue(b.currency, total, tickers);
              return (
                <tr
                  key={b.currency}
                  className="border-t border-border/60 transition hover:bg-surface-muted/40"
                >
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
