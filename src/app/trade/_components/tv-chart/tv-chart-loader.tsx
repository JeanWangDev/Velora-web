/**
 * TV 图表客户端入口：dynamic 关闭 SSR，加载中显示 trade.loading 文案。
 */
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { useTranslation } from "@/i18n/use-translation";

/**
 * TV Charting Library 必须在客户端运行（依赖 window）。
 * 用 next/dynamic 关闭 SSR；包一层 client component 是因为
 * App Router 的 Server Component 不允许直接传 `ssr: false`。
 */
const TVChart = dynamic(() => import("@/app/trade/_components/tv-chart"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});

function LoadingFallback() {
  const t = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#000000] text-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {t("trade.loading")}
    </div>
  );
}

interface TVChartLoaderProps {
  symbol: string;
  interval: string;
  datafeedMode?: "live" | "mock";
  onControlsReady?: (controls: TVChartControls) => void;
  onControlsDispose?: () => void;
}

export function TVChartLoader({
  symbol,
  interval,
  datafeedMode = "live",
  onControlsReady,
  onControlsDispose,
}: TVChartLoaderProps) {
  return (
    <TVChart
      symbol={symbol}
      interval={interval}
      datafeedMode={datafeedMode}
      onControlsReady={onControlsReady}
      onControlsDispose={onControlsDispose}
    />
  );
}
