"use client";

import { useState } from "react";
import { TVChartLoader } from "@/app/trade/_components/tv-chart/tv-chart-loader";
import { IntervalPicker } from "@/app/trade/_components/interval-picker";
import type { TVResolution } from "@/app/trade/_types/chart";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { veloraSymbolToTv } from "@/app/trade/_components/tv-chart/mock-datafeed";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { getSymbolMeta } from "@/mocks/exchange-data";
import { NewsModal } from "@/components/exchange/okx/news-modal";
import { ChartIndicatorBar } from "@/components/exchange/okx/chart-indicator-bar";
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
  const meta = getSymbolMeta(symbol);
  const tvSymbol = veloraSymbolToTv(symbol);

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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-black">
      <div className="flex h-9 shrink-0 items-center border-b border-[#1f1f1f]">
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
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[#1f1f1f] px-2">
            <IntervalPicker
              value={interval}
              onChange={onIntervalChange}
              variant="terminal"
            />
            <span className="ml-auto rounded bg-[#141414] px-2 py-0.5 text-[10px] text-muted">
              TradingView
            </span>
          </div>

          {/* K 线区域：overflow 裁剪 TV iframe，避免盖住底部指标栏 */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <TVChartLoader
              symbol={tvSymbol}
              interval={interval}
              datafeedMode="mock"
              onControlsReady={setChartControls}
              onControlsDispose={() => setChartControls(null)}
            />
          </div>

          {/* 主/副指标快捷栏：固定在 K 线下方，始终可见 */}
          <div className="relative z-20 shrink-0 border-t border-[#1f1f1f] bg-[#0a0a0a]">
            <ChartIndicatorBar chartControls={chartControls} />
          </div>
        </div>
      ) : null}

      {tab === "info" && (
        <div className="terminal-scroll flex-1 overflow-y-auto p-4 text-sm">
          <h3 className="text-lg font-semibold">{meta?.displayName}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {meta?.base} 是 Velora 现货交易对，当前为内测模拟环境，不涉及真实资金。
            交易规则：最小下单量 {meta?.minQty} {meta?.base}，价格精度{" "}
            {meta?.pricePrecision} 位。
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
                className="flex justify-between border-b border-[#1f1f1f] py-2"
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
          {["资金流向", "净流向", "多空比", "买卖量"].map((title) => (
            <div
              key={title}
              className="rounded border border-[#1f1f1f] bg-[#0a0a0a] p-3"
            >
              <p className="text-xs font-medium">{title}</p>
              <div className="mt-4 flex h-24 items-center justify-center text-[10px] text-muted">
                Mock · 接入后端后展示
              </div>
            </div>
          ))}
        </div>
      )}

      <NewsModal open={newsOpen} onClose={() => setNewsOpen(false)} />
    </div>
  );
}
