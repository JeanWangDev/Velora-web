"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { TVChartLoader } from "@/app/trade/_components/tv-chart/tv-chart-loader";
import { IntervalPicker } from "@/app/trade/_components/interval-picker";
import { ChartTypePicker } from "@/app/trade/_components/chart-type-picker";
import { useChartType } from "@/app/trade/_hooks/use-chart-type";
import type { TVResolution } from "@/app/trade/_types/chart";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { veloraSymbolToTv } from "@/app/trade/_components/tv-chart/mock-datafeed";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { formatCompact, formatPercent, formatPrice } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";
import { NewsModal } from "@/components/exchange/okx/news-modal";
import { ChartIndicatorBar } from "@/components/exchange/okx/chart-indicator-bar";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

type CenterTab = "chart" | "info" | "data" | "news";

export function ChartStage({
  symbol,
  interval,
  onIntervalChange,
}: {
  symbol: string;
  interval: TVResolution;
  onIntervalChange: (v: TVResolution) => void;
}) {
  const t = useExchangeT();
  const [tab, setTab] = useState<CenterTab>("chart");
  const [newsOpen, setNewsOpen] = useState(false);
  const [chartControls, setChartControls] = useState<TVChartControls | null>(null);
  const { chartType, setChartType } = useChartType();
  const meta = getSymbolMeta(symbol);
  const locale = useLocale();
  const ticker = useMarketStore((s) => s.tickers[symbol]);
  const tvSymbol = veloraSymbolToTv(symbol);

  useEffect(() => {
    if (!chartControls) return;
    chartControls.setChartType(chartType);
  }, [chartControls, chartType]);

  const tabs: { key: CenterTab; label: string }[] = [
    { key: "chart", label: t("trade.tabChart") },
    { key: "info", label: t("trade.tabInfo") },
    { key: "data", label: t("trade.tabData") },
    { key: "news", label: t("trade.tabNews") },
  ];

  const onTab = (key: CenterTab) => {
    if (key === "news") {
      setNewsOpen(true);
      return;
    }
    setTab(key);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-[var(--terminal-bg)]">
      <div className="flex h-9 shrink-0 items-center border-b border-[var(--terminal-border)]">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTab(item.key)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition",
              tab === item.key && item.key !== "news"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "chart" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[var(--terminal-border)] px-2">
            <IntervalPicker
              value={interval}
              onChange={onIntervalChange}
              variant="terminal"
            />
            <span className="mx-0.5 h-4 w-px shrink-0 bg-[var(--terminal-border)]" />
            <ChartTypePicker
              value={chartType}
              onChange={setChartType}
              disabled={!chartControls}
              variant="terminal"
            />
            <button
              type="button"
              disabled={!chartControls}
              title={t("trade.settings")}
              aria-label={t("trade.settings")}
              onClick={() => {
                if (!chartControls) {
                  toast.info(t("trade.chartLoading"));
                  return;
                }
                chartControls.openChartSettings();
              }}
              className={cn(
                "ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--terminal-border)] text-[var(--terminal-muted)] transition",
                "hover:border-[var(--terminal-border-strong)] hover:text-[var(--terminal-text)]",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* K 线区域：overflow 裁剪 TV iframe，避免盖住底部指标栏 */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <TVChartLoader
              symbol={tvSymbol}
              interval={interval}
              datafeedMode="live"
              onControlsReady={setChartControls}
              onControlsDispose={() => setChartControls(null)}
            />
          </div>

          {/* 主/副指标快捷栏：固定在 K 线下方，始终可见 */}
          <div className="relative z-20 shrink-0 border-t border-[var(--terminal-border)] bg-[var(--terminal-panel)]">
            <ChartIndicatorBar chartControls={chartControls} />
          </div>
        </div>
      ) : null}

      {tab === "info" && (
        <div className="terminal-scroll flex-1 overflow-y-auto p-4 text-sm">
          <h3 className="text-lg font-semibold">{meta?.displayName}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {meta?.base} / {meta?.quote} · {meta?.displayName}
            {meta?.minQty != null ? ` · min ${meta.minQty}` : ""}
          </p>
          <div className="mt-4 grid gap-2 text-xs">
            {[
              ["币种", meta?.base],
              ["计价", meta?.quote],
              ["类型", "Spot"],
              ["状态", "Trading"],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                className="flex justify-between border-b border-[var(--terminal-border)] py-2"
              >
                <span className="text-muted">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="grid flex-1 grid-cols-2 gap-2 p-2">
          {[
            { label: t("trade.high24h"), value: ticker ? formatPrice(ticker.high24h, meta?.pricePrecision ?? 2, locale) : "—" },
            { label: t("trade.low24h"), value: ticker ? formatPrice(ticker.low24h, meta?.pricePrecision ?? 2, locale) : "—" },
            { label: t("trade.vol24h"), value: ticker ? `${formatCompact(ticker.volume24h, locale)} ${meta?.base ?? ""}` : "—" },
            { label: t("markets.change"), value: ticker ? formatPercent(ticker.change24h) : "—" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded border border-[var(--terminal-border)] bg-[var(--terminal-panel)] p-3"
            >
              <p className="text-xs font-medium text-muted">{card.label}</p>
              <p className="mt-2 font-mono text-sm tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <NewsModal open={newsOpen} onClose={() => setNewsOpen(false)} />
    </div>
  );
}
