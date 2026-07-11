/**
 * TradingView Charting Library 容器：加载 vendor、创建 widget、主题与周期联动。
 * 历史 K 线经 datafeed → Worker → trading-api；勿将本目录提升到 src/components。
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import {
  createMarketDatafeed,
  resetDatafeedState,
} from "@/app/trade/_components/tv-chart/datafeed";
import { createMockDatafeed } from "@/app/trade/_components/tv-chart/mock-datafeed";
import type { TVDatafeed } from "@/types/charting-library";
import type { TVChartControls } from "@/app/trade/_components/tv-chart/tv-chart-controls";
import { getIndicatorById } from "@/app/trade/_config/indicators";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import { getThirdPartyLocale } from "@/i18n/locale-helpers";
import { applyChartEventMarkers } from "@/app/trade/_components/tv-chart/chart-event-markers";
import {
  applyPriceLevelShapes,
  clearPriceLevelShapes,
  resetPriceLevelShapeRegistry,
} from "@/app/trade/_components/tv-chart/chart-price-levels";
import type { TVWidgetInstance } from "@/types/charting-library";
import {
  captureTradingViewChart,
  CHART_SCREENSHOT_FILENAME,
  downloadChartScreenshot,
  downloadChartScreenshotDataUrl,
} from "@/utils/chart-screenshot";

interface TVChartProps {
  symbol: string;
  /** TV resolution 字符串："1" / "5" / "15" / "30" / "60" / "240" / "1D" */
  interval: string;
  /** live = trading-api；mock = Velora 模拟行情 */
  datafeedMode?: "live" | "mock";
  onControlsReady?: (controls: TVChartControls) => void;
  onControlsDispose?: () => void;
}

/** vendor 文件实际目录：public/charting_library/charting_library/ */
const LIBRARY_PATH = "/charting_library/charting_library/";
const LIBRARY_JS = `${LIBRARY_PATH}charting_library.min.js`;

function isTradingViewLoaded(): boolean {
  return typeof window !== "undefined" && Boolean(window.TradingView?.widget);
}

function createContainerId(): string {
  return `tv-chart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TVChart({
  symbol,
  interval,
  datafeedMode = "live",
  onControlsReady,
  onControlsDispose,
}: TVChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<TVWidgetInstance | null>(null);
  /** 每次挂载独立 id，避免 TV 复用已 remove 的 container_id */
  const [containerId] = useState(createContainerId);
  const chartReadyRef = useRef(false);
  const appliedSymbolRef = useRef<string | null>(null);
  const symbolRef = useRef(symbol);
  const onControlsReadyRef = useRef(onControlsReady);
  const onControlsDisposeRef = useRef(onControlsDispose);
  const unsubscribeScreenshotRef = useRef<(() => void) | null>(null);
  const widgetGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  // 脚本已缓存时 onLoad 不会再次触发，需同步检测 window.TradingView
  const [tvReady, setTvReady] = useState(isTradingViewLoaded);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    onControlsReadyRef.current = onControlsReady;
    onControlsDisposeRef.current = onControlsDispose;
  }, [onControlsReady, onControlsDispose]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isTradingViewLoaded()) {
      setTvReady(true);
    }
  }, []);
  const locale = useLocale();
  const t = useTranslation();

  const isDark = resolvedTheme === "dark";
  const tvLocale = getThirdPartyLocale(locale);

  // interval / theme / locale 变化时销毁并重建 widget；symbol 单独用 setSymbol 切换
  useEffect(() => {
    if (!tvReady) {
      return;
    }
    if (typeof window === "undefined" || !window.TradingView) {
      return;
    }
    if (!containerRef.current) {
      return;
    }

    const widgetGeneration = ++widgetGenerationRef.current;

    // 切换 resolution/theme/locale 时，先清空 datafeed 订阅
    resetDatafeedState();

    const datafeed: TVDatafeed =
      datafeedMode === "mock" ? createMockDatafeed() : createMarketDatafeed();

    const widget = new window.TradingView.widget({
      container_id: containerId,
      datafeed,
      symbol,
      interval,
      library_path: LIBRARY_PATH,
      locale: tvLocale,
      theme: isDark ? "Dark" : "Light",
      autosize: true,
      timezone: "Etc/UTC",
      custom_css_url: "/charting_library/tv-custom.css",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_widget",
        "timeframes_toolbar",
        "edit_buttons_in_legend",
        "display_market_status",
        "show_dialog_on_snapshot_ready",
      ],
      enabled_features: [],
      overrides: {
        "paneProperties.background": isDark ? "#000000" : "#ffffff",
        // 隐藏主图品种 OHLC 图例，保留指标图例
        "paneProperties.legendProperties.showLegend": true,
        "paneProperties.legendProperties.showSeriesTitle": false,
        "paneProperties.legendProperties.showSeriesOHLC": false,
        "paneProperties.legendProperties.showBarChange": false,
        "paneProperties.legendProperties.showStudyTitles": true,
        "paneProperties.legendProperties.showStudyValues": true,
        "paneProperties.vertGridProperties.color": isDark
          ? "rgba(148, 163, 184, 0.08)"
          : "rgba(15, 23, 42, 0.06)",
        "paneProperties.horzGridProperties.color": isDark
          ? "rgba(148, 163, 184, 0.08)"
          : "rgba(15, 23, 42, 0.06)",
        "scalesProperties.textColor": isDark ? "#cbd5f5" : "#475569",
        "mainSeriesProperties.candleStyle.upColor": isDark ? "#98D330" : "#22c55e",
        "mainSeriesProperties.candleStyle.downColor": isDark ? "#E93E8B" : "#f43f5e",
        "mainSeriesProperties.candleStyle.borderUpColor": isDark ? "#98D330" : "#22c55e",
        "mainSeriesProperties.candleStyle.borderDownColor": isDark ? "#E93E8B" : "#f43f5e",
        "mainSeriesProperties.candleStyle.wickUpColor": isDark ? "#98D330" : "#22c55e",
        "mainSeriesProperties.candleStyle.wickDownColor": isDark ? "#E93E8B" : "#f43f5e",
      },
    });

    widgetRef.current = widget;

    let chartReadyCleanup: (() => void) | null = null;
    /** 防止 remove 之后迟到的 onChartReady / 异步 marker 仍操作 widget */
    let disposed = false;
    const markersAbort = new AbortController();

    widget.onChartReady(() => {
      if (
        disposed ||
        widgetGeneration !== widgetGenerationRef.current
      ) {
        return;
      }

      const appliedListeners = new Set<(ids: string[]) => void>();
      const studyEntityMap = new Map<string, string>();

      const emitApplied = () => {
        const ids = Array.from(studyEntityMap.keys());
        for (const listener of appliedListeners) {
          listener(ids);
        }
      };

      let pendingScreenshotDownload = false;

      const handleScreenshotReady = (source: string) => {
        if (disposed || !pendingScreenshotDownload) {
          return;
        }

        pendingScreenshotDownload = false;
        void downloadChartScreenshot(source, CHART_SCREENSHOT_FILENAME);
      };

      widget.subscribe("onScreenshotReady", handleScreenshotReady);
      unsubscribeScreenshotRef.current = () => {
        try {
          widget.unsubscribe("onScreenshotReady", handleScreenshotReady);
        } catch {
          // remove 之后 TV 内部 API 可能已为 null
        }
      };

      const controls: TVChartControls = {
        setChartType: (type) => {
          try {
            widget.activeChart().setChartType(type);
          } catch {
            try {
              widget.activeChart().setChartType(1);
            } catch {
              /* widget 可能已销毁 */
            }
          }
        },
        getChartType: () => widget.activeChart().chartType(),
        takeScreenshot: () => {
          const dataUrl = captureTradingViewChart(containerRef.current);
          if (dataUrl) {
            downloadChartScreenshotDataUrl(dataUrl, CHART_SCREENSHOT_FILENAME);
            return;
          }

          pendingScreenshotDownload = true;
          widget.takeScreenshot();
        },
        applyIndicators: async (toAddIds, toRemoveIds) => {
          if (disposed || widgetGeneration !== widgetGenerationRef.current) {
            return;
          }

          const chart = widget.activeChart();

          // 先删后增，避免同名 study 残留
          for (const id of toRemoveIds) {
            if (disposed || widgetGeneration !== widgetGenerationRef.current) {
              return;
            }
            const entityId = studyEntityMap.get(id);
            if (!entityId) continue;
            try {
              chart.removeEntity(entityId);
            } catch {
              /* widget 可能已 remove */
            }
            studyEntityMap.delete(id);
          }

          for (const id of toAddIds) {
            if (disposed || widgetGeneration !== widgetGenerationRef.current) {
              return;
            }
            if (studyEntityMap.has(id)) continue;

            const definition = getIndicatorById(id);
            if (!definition?.tvStudyName) continue;

            let entityId: string | null = null;
            try {
              entityId = await chart.createStudy(
                definition.tvStudyName,
                definition.forceOverlay ?? false,
              );
            } catch {
              return;
            }

            if (disposed || widgetGeneration !== widgetGenerationRef.current) {
              return;
            }

            if (entityId) {
              studyEntityMap.set(id, entityId);
            }
          }

          if (!disposed && widgetGeneration === widgetGenerationRef.current) {
            emitApplied();
          }
        },
        getAppliedIndicatorIds: () => Array.from(studyEntityMap.keys()),
        subscribeAppliedIndicators: (listener) => {
          appliedListeners.add(listener);
          listener(Array.from(studyEntityMap.keys()));
          return () => {
            appliedListeners.delete(listener);
          };
        },
        setPriceLevels: (levels) => {
          applyPriceLevelShapes(widget, levels.supports, levels.resistances);
        },
        clearPriceLevels: () => {
          clearPriceLevelShapes(widget);
        },
        openChartSettings: () => {
          try {
            widget.activeChart().executeActionById("chartProperties");
          } catch {
            /* widget 可能已销毁 */
          }
        },
      };

      if (disposed || widgetGeneration !== widgetGenerationRef.current) {
        return;
      }

      onControlsReadyRef.current?.(controls);

      chartReadyRef.current = true;
      const currentSymbol = symbolRef.current;
      appliedSymbolRef.current = currentSymbol;
      if (currentSymbol !== symbol) {
        widget.setSymbol?.(currentSymbol, interval, () => {
          if (disposed || !widgetRef.current) {
            return;
          }
          void applyChartEventMarkers(widgetRef.current, currentSymbol, markersAbort.signal);
        });
      } else {
        void applyChartEventMarkers(widget, currentSymbol, markersAbort.signal);
      }

      chartReadyCleanup = () => {
        pendingScreenshotDownload = false;
        appliedListeners.clear();
        studyEntityMap.clear();
        // 卸载时 widget 可能已失效，仅清本地 shape id（widget.remove 会销毁图形）
        resetPriceLevelShapeRegistry();
      };
    });

    return () => {
      disposed = true;
      chartReadyRef.current = false;
      appliedSymbolRef.current = null;
      markersAbort.abort();
      chartReadyCleanup?.();
      chartReadyCleanup = null;
      onControlsDisposeRef.current?.();
      unsubscribeScreenshotRef.current?.();
      unsubscribeScreenshotRef.current = null;
      try {
        widget.remove();
      } catch {
        // 路由切换或依赖变更时 TV 可能已 remove，忽略二次销毁
      }
      widgetRef.current = null;
      resetDatafeedState();
    };
    // containerId 挂载后不变；symbol 由下方独立 effect 通过 setSymbol 切换，此处刻意不重建 widget。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvReady, interval, isDark, tvLocale, datafeedMode]);

  // 仅切换币对时走 TV setSymbol，避免整表销毁导致订阅/接口报错
  useEffect(() => {
    if (!chartReadyRef.current) {
      return;
    }
    const widget = widgetRef.current;
    if (!widget?.setSymbol) {
      return;
    }
    if (appliedSymbolRef.current === symbol) {
      return;
    }

    appliedSymbolRef.current = symbol;
    resetDatafeedState();

    const abort = new AbortController();
    widget.setSymbol?.(symbol, interval, () => {
      if (abort.signal.aborted || !widgetRef.current || !chartReadyRef.current) {
        return;
      }
      void applyChartEventMarkers(widgetRef.current, symbol, abort.signal);
    });

    return () => {
      abort.abort();
    };
  }, [symbol, interval]);

  return (
    <div className="relative h-full w-full">
      {/* vendor 脚本；onLoad 后触发上方 useEffect 创建 widget */}
      <Script
        src={LIBRARY_JS}
        strategy="afterInteractive"
        onLoad={() => {
          if (mountedRef.current) {
            setTvReady(true);
          }
        }}
        onReady={() => {
          if (mountedRef.current && isTradingViewLoaded()) {
            setTvReady(true);
          }
        }}
      />

      <div
        ref={containerRef}
        id={containerId}
        className="h-full w-full bg-[var(--terminal-bg)]"
      />

      {!tvReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80 text-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("trade.loading")}
        </div>
      ) : null}
    </div>
  );
}
