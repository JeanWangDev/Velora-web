/**
 * 配置表 display 名 → 本项目 TV Charting Library v1.15 内置 study 名。
 * 重叠时以 data.ts 里的用户命名为准，tvStudyName 走此映射。
 */
export const TV_STUDY_NAME_OVERRIDES: Record<string, string> = {
  "Accelerator Oscillator": "Awesome Oscillator",
  "Correlation Coefficient": "Correlation - Log",
  "Directional Movement": "Directional Movement Index",
  "Ease Of Movement": "Ease of Movement",
  "Hull Moving Average": "Hull MA",
  "True Strength Index": "True Strength Indicator",
  "Williams %R": "Willams %R",
};

/** 本版 TV 库无内置 study，不参与上图 */
export const TV_UNAVAILABLE_STUDIES = new Set([
  "52 Week High/Low",
  "Double EMA",
  "Guppy Multiple Moving Average",
  "Rank Correlation Index",
  "Volume Profile Fixed Range",
  "Volume Profile Visible Range",
  "Williams Fractal",
  "Zig Zag",
]);

/** 叠在主图上的 study（按 TV 常见 is_price_study 行为归纳） */
export function isOverlayStudy(tvStudyName: string): boolean {
  if (
    /Moving Average|Linear Regression Curve|Least Squares Moving Average/.test(
      tvStudyName,
    )
  ) {
    return true;
  }

  return (
    tvStudyName === "Bollinger Bands" ||
    tvStudyName === "Parabolic SAR" ||
    tvStudyName === "Ichimoku Cloud" ||
    tvStudyName === "Envelopes" ||
    tvStudyName === "Donchian Channels" ||
    tvStudyName === "Keltner Channels" ||
    tvStudyName === "VWAP" ||
    tvStudyName === "SuperTrend" ||
    tvStudyName === "Price Channel" ||
    tvStudyName === "McGinley Dynamic" ||
    tvStudyName === "Hull MA" ||
    tvStudyName === "Arnaud Legoux Moving Average" ||
    tvStudyName === "Smoothed Moving Average" ||
    tvStudyName === "Chande Kroll Stop" ||
    tvStudyName === "Pivot Points Standard"
  );
}
