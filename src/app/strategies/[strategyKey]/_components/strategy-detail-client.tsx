"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BillingService } from "@/services/billing-service";
import { CopyService } from "@/services/copy-service";
import { ExchangeService } from "@/services/exchange-service";
import { StrategyService } from "@/services/strategy-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation, type TranslationKey } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { StrategyProduct, StrategySignalPayload } from "@/types/strategy";

interface StrategyDetailClientProps {
  strategyKey: string;
}

function formatPct(value: string | null | undefined): string {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function formatUsdt(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString();
}

function signalLabel(signal: string, t: (k: TranslationKey) => string): string {
  if (signal === "bullish") return t("strategies.signalBullish");
  if (signal === "bearish") return t("strategies.signalBearish");
  return t("strategies.signalNeutral");
}

export function StrategyDetailClient({ strategyKey }: StrategyDetailClientProps) {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [strategy, setStrategy] = useState<StrategyProduct | null>(null);
  const [signal, setSignal] = useState<StrategySignalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [signalLoading, setSignalLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [okxConnectionId, setOkxConnectionId] = useState<number | null>(null);
  const [copyEnabled, setCopyEnabled] = useState(false);
  const [orderSizeUsdt, setOrderSizeUsdt] = useState("100");
  const [copyLoading, setCopyLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await StrategyService.get(strategyKey);
      setStrategy(result.strategy);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [strategyKey, t]);

  const loadSignal = useCallback(async () => {
    if (!user) return;
    setSignalLoading(true);
    try {
      const data = await StrategyService.getSignal(strategyKey);
      setSignal(data);
    } catch {
      setSignal(null);
    } finally {
      setSignalLoading(false);
    }
  }, [strategyKey, user]);

  const loadCopyState = useCallback(async () => {
    if (!user) return;
    try {
      const [exchanges, copies] = await Promise.all([
        ExchangeService.list(),
        CopyService.list(),
      ]);
      const okx = exchanges.connections.find((c) => c.exchange === "okx");
      setOkxConnectionId(okx?.id ?? null);
      const active = copies.subscriptions.some((s) => s.strategyKey === strategyKey);
      setCopyEnabled(active);
    } catch {
      setOkxConnectionId(null);
      setCopyEnabled(false);
    }
  }, [strategyKey, user]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  useEffect(() => {
    if (!hydrated || !user) return;
    void loadCopyState();
  }, [hydrated, user, loadCopyState]);

  useEffect(() => {
    if (!strategy?.subscribed || !user) return;
    void loadSignal();
    const timer = setInterval(() => void loadSignal(), 90_000);
    return () => clearInterval(timer);
  }, [loadSignal, strategy?.subscribed, user]);

  const handleEnableCopy = async () => {
    if (!okxConnectionId) {
      toast.error(t("strategies.okxRequired"));
      router.push("/settings/exchanges");
      return;
    }
    setCopyLoading(true);
    try {
      await CopyService.subscribe({
        strategyKey,
        exchangeConnectionId: okxConnectionId,
        orderSizeUsdt: Number(orderSizeUsdt),
        tradeMode: "live",
      });
      setCopyEnabled(true);
      toast.success(t("strategies.liveCopyEnabled"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.liveCopyFailed"));
    } finally {
      setCopyLoading(false);
    }
  };

  const handleDisableCopy = async () => {
    setCopyLoading(true);
    try {
      await CopyService.unsubscribe(strategyKey);
      setCopyEnabled(false);
      toast.success(t("strategies.liveCopyDisabled"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.liveCopyFailed"));
    } finally {
      setCopyLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!strategy?.planKey) return;
    if (!user) {
      toast.error(t("strategies.loginRequired"));
      return;
    }

    setSubscribing(true);
    try {
      const result = await BillingService.createOrder(strategy.planKey);
      router.push(`/orders/${result.order.orderNo}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.subscribeFailed"));
    } finally {
      setSubscribing(false);
    }
  };

  if (!hydrated) return null;

  if (loading && !strategy) {
    return <div className="px-4 py-16 text-sm text-muted">{t("strategies.loading")}</div>;
  }

  if (!strategy) {
    return <div className="px-4 py-16 text-sm text-muted">{t("strategies.notFound")}</div>;
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/strategies" className="text-sm text-accent hover:underline">
        ← {t("strategies.backToList")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>
                {t("strategies.creator")}: {strategy.creatorNickname ?? "—"}
              </span>
              <span>·</span>
              <span>
                {t("strategies.colFollowers")}: {strategy.followerCount}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{strategy.name}</h1>
            <p className="mt-2 text-sm text-muted">{strategy.summary}</p>
            <p className="mt-4 text-sm leading-7 text-foreground/90">{strategy.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {strategy.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-background/60 px-2.5 py-1 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted">
              {strategy.symbol} · {strategy.interval} · {strategy.chain}
            </div>

            {strategy.stats ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-xl border border-border p-3">
                  <div className="text-xs text-muted">{t("strategies.colReturn")}</div>
                  <div className="font-semibold">{formatPct(strategy.stats.totalReturnPct)}</div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="text-xs text-muted">{t("strategies.colDrawdown")}</div>
                  <div className="font-semibold">{formatPct(strategy.stats.maxDrawdownPct)}</div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="text-xs text-muted">{t("strategies.colSharpe")}</div>
                  <div className="font-semibold">{strategy.stats.sharpeRatio}</div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="text-xs text-muted">{t("strategies.colWinRate")}</div>
                  <div className="font-semibold">{formatPct(strategy.stats.winRate)}</div>
                </div>
              </div>
            ) : null}
          </div>

          {strategy.subscribed ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-foreground">{t("strategies.liveSignal")}</h2>
                <Link
                  href={`/trade?symbol=${encodeURIComponent(strategy.symbol)}`}
                  className="text-xs text-accent hover:underline"
                >
                  {t("strategies.openChart")}
                </Link>
              </div>

              {signalLoading && !signal ? (
                <p className="mt-4 text-sm text-muted">{t("strategies.signalLoading")}</p>
              ) : signal ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-border bg-background/40 p-4 text-center">
                    <div className="text-xs text-muted">{t("strategies.currentSignal")}</div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">
                      {signalLabel(signal.brief.signal, t)}
                    </div>
                    <div className="mt-1 text-sm text-muted">{signal.brief.actionHint}</div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {signal.brief.checks.map((check) => (
                      <li
                        key={check.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-foreground">{check.label}</span>
                        <span className="text-xs text-muted">{check.status}</span>
                      </li>
                    ))}
                  </ul>

                  {strategy.subscriptionEndsAt ? (
                    <p className="text-xs text-muted">
                      {t("strategies.validUntil").replace(
                        "{date}",
                        formatDateTime(strategy.subscriptionEndsAt),
                      )}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">{t("strategies.signalUnavailable")}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-6 text-center">
              <p className="text-sm text-muted">{t("strategies.subscribeToUnlock")}</p>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-sm text-muted">{t("strategies.price")}</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">
              {formatUsdt(strategy.priceUsdt)}{" "}
              <span className="text-base font-normal text-muted">{strategy.asset}</span>
            </div>
            <div className="mt-1 text-xs text-muted">
              {strategy.durationDays}
              {t("strategies.days")}
            </div>

            {strategy.subscribed && !strategy.isOwner ? (
              <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
                <div className="text-sm font-medium text-foreground">{t("strategies.liveCopyTitle")}</div>
                <p className="text-xs text-muted">{t("strategies.liveCopyHint")}</p>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={orderSizeUsdt}
                  onChange={(e) => setOrderSizeUsdt(e.target.value)}
                  placeholder={t("strategies.liveCopySize")}
                />
                {copyEnabled ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border px-4 py-2 text-sm"
                    disabled={copyLoading}
                    onClick={() => void handleDisableCopy()}
                  >
                    {t("strategies.liveCopyStop")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-xl bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
                    disabled={copyLoading}
                    onClick={() => void handleEnableCopy()}
                  >
                    {t("strategies.liveCopyStart")}
                  </button>
                )}
                <Link href="/settings/exchanges" className="block text-center text-xs text-accent hover:underline">
                  {t("strategies.manageOkx")}
                </Link>
              </div>
            ) : null}

            {strategy.isOwner ? (
              <div className="mt-6 rounded-xl bg-background/60 px-4 py-3 text-center text-sm text-muted">
                {t("strategies.ownerHint")}
              </div>
            ) : strategy.subscribed ? (
              <div className="mt-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-600 dark:text-emerald-400">
                {t("strategies.following")}
              </div>
            ) : (
              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
                disabled={subscribing}
                onClick={() => void handleSubscribe()}
              >
                {subscribing ? t("strategies.followingInProgress") : t("strategies.follow")}
              </button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
