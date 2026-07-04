"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StrategyService } from "@/services/strategy-service";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import { CreatorEarningsPanel } from "./creator-earnings-panel";
import type { StrategyProduct } from "@/types/strategy";

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

type MineTab = "following" | "published";

export function StrategiesPageClient() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [strategies, setStrategies] = useState<StrategyProduct[]>([]);
  const [mine, setMine] = useState<StrategyProduct[]>([]);
  const [mineTab, setMineTab] = useState<MineTab>("following");
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const listResult = await StrategyService.list();
      setStrategies(listResult.strategies);

      if (user) {
        const mineResult = await StrategyService.mine(mineTab);
        setMine(mineResult.strategies);
      } else {
        setMine([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, user, mineTab]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  if (!hydrated) return null;

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("strategies.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("strategies.subtitle")}</p>
        </div>
        {user ? (
          <Link
            href="/strategies/create"
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            {t("strategies.createCta")}
          </Link>
        ) : null}
      </div>

      {user ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-medium text-foreground">{t("strategies.myStrategies")}</h2>
            <div className="flex rounded-xl border border-border p-0.5 text-xs">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 ${
                  mineTab === "following" ? "bg-accent text-accent-foreground" : "text-muted"
                }`}
                onClick={() => setMineTab("following")}
              >
                {t("strategies.tabFollowing")}
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 ${
                  mineTab === "published" ? "bg-accent text-accent-foreground" : "text-muted"
                }`}
                onClick={() => setMineTab("published")}
              >
                {t("strategies.tabPublished")}
              </button>
            </div>
          </div>

          {mine.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-surface text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3">{t("strategies.colName")}</th>
                    <th className="px-4 py-3">{t("strategies.colCreator")}</th>
                    <th className="px-4 py-3">{t("strategies.colFollowers")}</th>
                    <th className="px-4 py-3">{t("strategies.colFee")}</th>
                    <th className="px-4 py-3">{t("strategies.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((item) => (
                    <tr key={item.strategyKey} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          href={`/strategies/${item.strategyKey}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {item.name}
                        </Link>
                        <div className="text-xs text-muted">
                          {item.symbol} · {item.interval}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {item.isOwner ? t("strategies.you") : item.creatorNickname ?? "—"}
                      </td>
                      <td className="px-4 py-3">{item.followerCount}</td>
                      <td className="px-4 py-3">
                        {formatUsdt(item.priceUsdt)} {item.asset}
                      </td>
                      <td className="px-4 py-3">
                        {item.subscribed || item.isOwner ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {item.isOwner ? item.visibility : t("strategies.following")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">{t("strategies.mineEmpty")}</p>
          )}

          {mineTab === "published" ? <CreatorEarningsPanel /> : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t("strategies.marketplace")}</h2>
        {loading ? (
          <p className="text-sm text-muted">{t("strategies.loading")}</p>
        ) : strategies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
            {t("strategies.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3">{t("strategies.colName")}</th>
                  <th className="px-4 py-3">{t("strategies.colCreator")}</th>
                  <th className="px-4 py-3">{t("strategies.colReturn")}</th>
                  <th className="px-4 py-3">{t("strategies.colDrawdown")}</th>
                  <th className="px-4 py-3">{t("strategies.colSharpe")}</th>
                  <th className="px-4 py-3">{t("strategies.colWinRate")}</th>
                  <th className="px-4 py-3">{t("strategies.colFollowers")}</th>
                  <th className="px-4 py-3">{t("strategies.colFee")}</th>
                  <th className="px-4 py-3">{t("strategies.colAction")}</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((item) => (
                  <tr key={item.strategyKey} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/strategies/${item.strategyKey}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <div className="text-xs text-muted">{item.summary}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.creatorNickname ?? "—"}</td>
                    <td className="px-4 py-3">{formatPct(item.stats?.totalReturnPct)}</td>
                    <td className="px-4 py-3">{formatPct(item.stats?.maxDrawdownPct)}</td>
                    <td className="px-4 py-3">{item.stats?.sharpeRatio ?? "—"}</td>
                    <td className="px-4 py-3">{formatPct(item.stats?.winRate)}</td>
                    <td className="px-4 py-3">{item.followerCount}</td>
                    <td className="px-4 py-3">
                      {formatUsdt(item.priceUsdt)} {item.asset}
                      <span className="text-xs text-muted">
                        {" "}
                        / {item.durationDays}
                        {t("strategies.days")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/strategies/${item.strategyKey}`}
                        className="rounded-xl border border-accent px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
                      >
                        {item.subscribed ? t("strategies.following") : t("strategies.follow")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!user ? (
        <>
          <p className="text-center text-sm text-muted">{t("strategies.loginHint")}</p>
          <div className="text-center">
            <button
              type="button"
              className="rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
              onClick={() => setLoginOpen(true)}
            >
              {t("site.login")}
            </button>
          </div>
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </>
      ) : null}
    </section>
  );
}
