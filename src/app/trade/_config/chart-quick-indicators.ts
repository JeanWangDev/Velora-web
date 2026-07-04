import { getIndicatorById, TRADE_INDICATORS } from "@/app/trade/_config/indicators";

export type QuickIndicatorKind = "main" | "sub";

export interface QuickIndicatorItem {
  key: string;
  labelZh: string;
  labelEn: string;
  kind: QuickIndicatorKind;
  /** TRADE_INDICATORS id */
  indicatorId?: string;
  /** TV 不可用时仅展示 */
  disabled?: boolean;
}

function bySource(sourceId: string): string | undefined {
  const slug = sourceId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const id = `technical.${slug}`;
  const hit = getIndicatorById(id);
  if (hit?.tvStudyName && !hit.phase2) return id;
  const fallback = TRADE_INDICATORS.find(
    (i) => i.tvStudyName === sourceId || i.labelEn === sourceId,
  );
  return fallback?.id;
}

/** OKX 原生版 K 线底部快捷指标（主 + 副合并一行） */
export const CHART_QUICK_INDICATORS: QuickIndicatorItem[] = [
  { key: "ma", labelZh: "MA", labelEn: "MA", kind: "main", indicatorId: bySource("Moving Average") },
  {
    key: "ema",
    labelZh: "EMA",
    labelEn: "EMA",
    kind: "main",
    indicatorId: bySource("Moving Average Exponential"),
  },
  {
    key: "boll",
    labelZh: "BOLL",
    labelEn: "BOLL",
    kind: "main",
    indicatorId: bySource("Bollinger Bands"),
  },
  {
    key: "sar",
    labelZh: "SAR",
    labelEn: "SAR",
    kind: "main",
    indicatorId: bySource("Parabolic SAR"),
  },
  { key: "td", labelZh: "TD", labelEn: "TD", kind: "main", disabled: true },
  { key: "vol", labelZh: "VOL", labelEn: "VOL", kind: "sub", indicatorId: bySource("Volume") },
  { key: "macd", labelZh: "MACD", labelEn: "MACD", kind: "sub", indicatorId: bySource("MACD") },
  {
    key: "kdj",
    labelZh: "KDJ",
    labelEn: "KDJ",
    kind: "sub",
    indicatorId: bySource("Stochastic"),
  },
  {
    key: "rsi",
    labelZh: "RSI",
    labelEn: "RSI",
    kind: "sub",
    indicatorId: bySource("Relative Strength Index"),
  },
  { key: "bias", labelZh: "BIAS", labelEn: "BIAS", kind: "sub", disabled: true },
  { key: "brar", labelZh: "BRAR", labelEn: "BRAR", kind: "sub", disabled: true },
  {
    key: "cci",
    labelZh: "CCI",
    labelEn: "CCI",
    kind: "sub",
    indicatorId: bySource("Commodity Channel Index"),
  },
  {
    key: "dmi",
    labelZh: "DMI",
    labelEn: "DMI",
    kind: "sub",
    indicatorId: bySource("Directional Movement"),
  },
  { key: "cr", labelZh: "CR", labelEn: "CR", kind: "sub", disabled: true },
  { key: "psy", labelZh: "PSY", labelEn: "PSY", kind: "sub", disabled: true },
  { key: "dma", labelZh: "DMA", labelEn: "DMA", kind: "sub", disabled: true },
  { key: "trix", labelZh: "TRIX", labelEn: "TRIX", kind: "sub", indicatorId: bySource("TRIX") },
  {
    key: "obv",
    labelZh: "OBV",
    labelEn: "OBV",
    kind: "sub",
    indicatorId: bySource("On Balance Volume"),
  },
  { key: "vr", labelZh: "VR", labelEn: "VR", kind: "sub", disabled: true },
  {
    key: "wr",
    labelZh: "WR",
    labelEn: "WR",
    kind: "sub",
    indicatorId: bySource("Williams %R"),
  },
  {
    key: "mtm",
    labelZh: "MTM",
    labelEn: "MTM",
    kind: "sub",
    indicatorId: bySource("Momentum"),
  },
  { key: "emv", labelZh: "EMV", labelEn: "EMV", kind: "sub", disabled: true },
];

export const MAX_SUB_INDICATORS = 3;
