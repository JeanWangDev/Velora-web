"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale } from "@/i18n/use-translation";
import { useMarketStore } from "@/stores/use-market-store";
import { useTradingStore } from "@/stores/use-trading-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatCompact } from "@/utils/format-exchange";

const STABLE = new Set(["USDT", "USDC"]);

function toUsd(
  currency: string,
  amount: number,
  tickers: ReturnType<typeof useMarketStore.getState>["tickers"],
) {
  if (STABLE.has(currency)) return amount;
  return amount * (tickers[`${currency}-USDT`]?.last ?? 0);
}

export function AssetsDropdown() {
  const t = useExchangeT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const user = useAuthStore((s) => s.user);
  const balances = useTradingStore((s) => s.getAccountBalances("trading"));
  const tickers = useMarketStore((s) => s.tickers);

  useEffect(() => {
    if (!user) return;
    void useTradingStore.getState().refreshBalances();
  }, [user]);

  const total = balances.reduce(
    (sum, b) => sum + toUsd(b.currency, b.available + b.frozen, tickers),
    0,
  );

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-primary/40"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">{t("assets.title")}</span>
        <span className="font-mono tabular-nums text-muted">
          ≈{mounted && user ? formatCompact(total, locale) : "--"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-3 py-2 text-xs text-muted">
            {t("assets.total")}:{" "}
            <span className="font-mono text-foreground">
              {user ? `${formatCompact(total, locale)} USDT` : "--"}
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {!user ? (
              <p className="px-3 py-4 text-center text-xs text-muted">
                {t("trade.deskLoginHint")}
              </p>
            ) : balances.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted">
                {t("common.noData")}
              </p>
            ) : (
              balances.map((b) => (
                <div
                  key={b.currency}
                  className="flex justify-between px-3 py-1.5 text-xs"
                >
                  <span>{b.currency}</span>
                  <span className="font-mono tabular-nums text-muted">
                    {(b.available + b.frozen).toFixed(4)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 border-t border-border p-2">
            <Link
              href="/assets"
              className="rounded-md bg-primary/15 py-1.5 text-center text-xs text-primary hover:bg-primary/25"
              onClick={() => setOpen(false)}
            >
              {t("assets.title")}
            </Link>
            <Link
              href="/assets/history"
              className="rounded-md bg-surface-muted py-1.5 text-center text-xs hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {t("assets.history")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
