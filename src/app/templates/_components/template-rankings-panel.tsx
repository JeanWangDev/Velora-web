"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Medal, TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { ChartTemplateService } from "@/services/chart-template-service";
import type { ChartTemplate } from "@/types/chart-template";
import type { ChartTemplateRankingItem, TemplateRankingPeriod } from "@/types/chart-template-ranking";
import { resolveTemplateSymbol } from "@/utils/chart-template";
import type { TradingPair } from "@/types/trading-pair";

type TemplateRankingsPanelProps = {
  pairs: TradingPair[];
  onApply: (template: ChartTemplate) => void;
  compact?: boolean;
};

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Medal className="h-5 w-5 text-amber-400" aria-hidden />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-slate-400" aria-hidden />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5 text-amber-700 dark:text-amber-600" aria-hidden />;
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold text-muted">
      {rank}
    </span>
  );
}

export function TemplateRankingsPanel({
  pairs,
  onApply,
  compact = false,
}: TemplateRankingsPanelProps) {
  const t = useTranslation();
  const [period, setPeriod] = useState<TemplateRankingPeriod>("week");
  const [items, setItems] = useState<ChartTemplateRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ChartTemplateService.rankings(period, compact ? 5 : 10);
      setItems(res.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [compact, period]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className={`rounded-xl border border-border bg-gradient-to-br from-accent/5 to-transparent ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
            {t("templatesPage.rankingsTitle")}
          </h2>
        </div>
        <div className="flex rounded-md border border-border bg-surface p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded px-2.5 py-1 font-medium transition ${
              period === "week"
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("templatesPage.rankingsWeek")}
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded px-2.5 py-1 font-medium transition ${
              period === "month"
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("templatesPage.rankingsMonth")}
          </button>
        </div>
      </div>

      {!compact ? (
        <p className="mb-3 text-xs text-muted">{t("templatesPage.rankingsSubtitle")}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-6 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">{t("templatesPage.rankingsEmpty")}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item) => {
            const refSymbol =
              resolveTemplateSymbol(item.template, pairs) ?? item.template.symbol;
            const isTopThree = item.rank <= 3;

            return (
              <li
                key={item.template.id}
                className={`flex items-center gap-3 rounded-lg border border-border/80 bg-surface/80 px-3 py-2.5 ${
                  isTopThree ? "shadow-sm" : ""
                }`}
              >
                <div className="flex w-6 shrink-0 justify-center">
                  <RankMedal rank={item.rank} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`truncate font-medium text-foreground ${
                        isTopThree ? "text-sm" : "text-xs"
                      }`}
                    >
                      {item.template.name}
                    </span>
                    {item.template.isOfficial ? (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                        {t("templatesPage.officialBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {t("templatesPage.rankingsStats")
                      .replace("{apply}", `${item.applyCount}${t("templatesPage.rankingsApply")}`)
                      .replace("{copy}", `${item.copyCount}${t("templatesPage.rankingsCopy")}`)}
                    {refSymbol ? ` · ${refSymbol}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onApply(item.template)}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  {t("templatesPage.applyOnTrade")}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
