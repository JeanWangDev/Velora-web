/**
 * Minimal ambient declarations for TradingView Charting Library v1.15.
 * 完整类型在 public/charting_library/charting_library/charting_library.min.d.ts，
 * 但因为该文件不在 tsconfig.json 的 include 范围里（vendor 目录），这里只声明
 * 项目代码实际用到的部分。
 */

export type TVTimezone = string;

export interface TVLibrarySymbolInfo {
  name: string;
  full_name: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  ticker?: string;
  exchange: string;
  listed_exchange: string;
  format: "price" | "volume";
  pricescale: number;
  minmov: number;
  fractional?: boolean;
  minmove2?: number;
  has_intraday?: boolean;
  has_seconds?: boolean;
  has_daily?: boolean;
  has_weekly_and_monthly?: boolean;
  supported_resolutions: string[];
  intraday_multipliers?: string[];
  seconds_multipliers?: string[];
  volume_precision?: number;
  data_status?: "streaming" | "endofday" | "pulsed" | "delayed_streaming";
}

export interface TVBar {
  /** 毫秒时间戳 */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TVHistoryMetadata {
  noData?: boolean;
  nextTime?: number;
}

export type TVErrorCallback = (reason: string) => void;
export type TVHistoryCallback = (bars: TVBar[], meta?: TVHistoryMetadata) => void;
export type TVSubscribeBarsCallback = (bar: TVBar) => void;
export type TVResolveCallback = (symbolInfo: TVLibrarySymbolInfo) => void;
export type TVResolutionString = string;

export interface TVDatafeedConfiguration {
  supported_resolutions?: string[];
  exchanges?: { value: string; name: string; desc: string }[];
  symbols_types?: { name: string; value: string }[];
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
}

export interface TVDatafeed {
  onReady: (callback: (config: TVDatafeedConfiguration) => void) => void;
  searchSymbols?: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: (
      items: {
        symbol: string;
        full_name: string;
        description: string;
        exchange: string;
        ticker: string;
        type: string;
      }[],
    ) => void,
  ) => void;
  resolveSymbol: (
    symbolName: string,
    onSymbolResolvedCallback: TVResolveCallback,
    onResolveErrorCallback: TVErrorCallback,
  ) => void;
  /**
   * v1.15 签名（6 参数）。`rangeStartDate` / `rangeEndDate` 是秒级时间戳。
   * 新版（v17+）会用 `periodParams` 对象，但本项目用的是 2020 v1.15。
   */
  getBars: (
    symbolInfo: TVLibrarySymbolInfo,
    resolution: TVResolutionString,
    rangeStartDate: number,
    rangeEndDate: number,
    onResult: TVHistoryCallback,
    onError: TVErrorCallback,
  ) => void;
  subscribeBars: (
    symbolInfo: TVLibrarySymbolInfo,
    resolution: TVResolutionString,
    onTick: TVSubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback?: () => void,
  ) => void;
  unsubscribeBars: (listenerGuid: string) => void;
  getServerTime?: (callback: (unixSec: number) => void) => void;
}

export interface TVWidgetOptions {
  container_id: string;
  datafeed: TVDatafeed;
  symbol: string;
  interval: string;
  library_path: string;
  locale?: string;
  theme?: "Light" | "Dark";
  fullscreen?: boolean;
  autosize?: boolean;
  timezone?: string;
  disabled_features?: string[];
  enabled_features?: string[];
  overrides?: Record<string, string | number | boolean>;
  studies_overrides?: Record<string, string | number | boolean>;
  debug?: boolean;
  custom_css_url?: string;
  loading_screen?: { backgroundColor?: string; foregroundColor?: string };
  toolbar_bg?: string;
}

export interface TVChartMarkApi {
  createShape?: (
    point: { time: number; price?: number },
    options: {
      shape?: string;
      text?: string;
      lock?: boolean;
      disableSave?: boolean;
      disableSelection?: boolean;
      disableUndo?: boolean;
      overrides?: Record<string, string | number | boolean>;
    },
  ) => string | null;
  removeAllShapes?: () => void;
  removeEntity?: (entityId: string) => void;
}

export interface TVWidgetInstance {
  onChartReady: (callback: () => void) => void;
  remove: () => void;
  chart?: () => TVChartMarkApi;
  setSymbol?: (symbol: string, interval: string, callback?: () => void) => void;
  changeTheme?: (theme: "Light" | "Dark") => void;
  activeChart: () => {
    executeActionById: (actionId: "undo" | "redo" | string) => void;
    createStudy: (
      name: string,
      forceOverlay: boolean,
    ) => Promise<string | null>;
    removeEntity: (entityId: string) => void;
    getVisibleRange: () => { from: number; to: number };
    setVisibleRange: (range: { from: number; to: number }) => Promise<void>;
    canZoomOut: () => boolean;
    zoomOut: () => void;
    setChartType: (type: number) => void;
    chartType: () => number;
  };
  undoRedoState: () => {
    enableUndo: boolean;
    enableRedo: boolean;
    undoText?: string;
    redoText?: string;
  };
  takeScreenshot: () => void;
  subscribe: (
    event: "undoRedoStackChanged" | "onScreenshotReady",
    callback:
      | ((state: {
          enableUndo: boolean;
          enableRedo: boolean;
          undoText?: string;
          redoText?: string;
        }) => void)
      | ((url: string) => void),
  ) => void;
  unsubscribe: (
    event: "undoRedoStackChanged" | "onScreenshotReady",
    callback:
      | ((state: {
          enableUndo: boolean;
          enableRedo: boolean;
          undoText?: string;
          redoText?: string;
        }) => void)
      | ((url: string) => void),
  ) => void;
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: TVWidgetOptions) => TVWidgetInstance;
    };
  }
}

export {};
