/**
 * 交易页 K 线周期配置：分组、置顶、标签映射。
 */
import type { TVResolution } from "@/app/trade/_types/chart";

export type IntervalOption = {
  label: string;
  value: TVResolution;
};

export type IntervalGroup = {
  id: "minutes" | "hours" | "days" | "weeks";
  labelKey:
    | "trade.intervals.minutes"
    | "trade.intervals.hours"
    | "trade.intervals.days"
    | "trade.intervals.weeks";
  items: IntervalOption[];
};

/** 默认置顶周期（对齐 OKX/Binance 常用栏） */
export const DEFAULT_PINNED_INTERVALS: TVResolution[] = [
  "1",
  "5",
  "15",
  "60",
  "240",
  "1D",
];

export const PINNED_INTERVALS_STORAGE_KEY = "polaris.pinnedIntervals";

export const INTERVAL_GROUPS: IntervalGroup[] = [
  {
    id: "minutes",
    labelKey: "trade.intervals.minutes",
    items: [
      { label: "1m", value: "1" },
      { label: "3m", value: "3" },
      { label: "5m", value: "5" },
      { label: "15m", value: "15" },
      { label: "30m", value: "30" },
    ],
  },
  {
    id: "hours",
    labelKey: "trade.intervals.hours",
    items: [
      { label: "1H", value: "60" },
      { label: "2H", value: "120" },
      { label: "4H", value: "240" },
      { label: "6H", value: "360" },
      { label: "8H", value: "480" },
      { label: "12H", value: "720" },
    ],
  },
  {
    id: "days",
    labelKey: "trade.intervals.days",
    items: [
      { label: "1D", value: "1D" },
      { label: "3D", value: "3D" },
    ],
  },
  {
    id: "weeks",
    labelKey: "trade.intervals.weeks",
    items: [
      { label: "1W", value: "1W" },
      { label: "1M", value: "1M" },
    ],
  },
];

export const ALL_INTERVAL_OPTIONS: IntervalOption[] = INTERVAL_GROUPS.flatMap(
  (group) => group.items,
);

const INTERVAL_LABEL_MAP = new Map<TVResolution, string>(
  ALL_INTERVAL_OPTIONS.map((item) => [item.value, item.label]),
);

/** @deprecated 使用 IntervalPicker + pinned intervals */
export const MAIN_INTERVAL_BUTTONS = DEFAULT_PINNED_INTERVALS.map((value) => ({
  value,
  label: intervalLabel(value),
}));

/** @deprecated 使用 INTERVAL_GROUPS */
export const MORE_INTERVAL_OPTIONS = ALL_INTERVAL_OPTIONS.filter(
  (item) => !DEFAULT_PINNED_INTERVALS.includes(item.value),
);

export function intervalLabel(value: TVResolution): string {
  return INTERVAL_LABEL_MAP.get(value) ?? value;
}

export function isValidTVResolution(value: string): value is TVResolution {
  return INTERVAL_LABEL_MAP.has(value as TVResolution);
}

export function normalizePinnedIntervals(values: unknown): TVResolution[] {
  if (!Array.isArray(values)) {
    return [...DEFAULT_PINNED_INTERVALS];
  }

  const seen = new Set<TVResolution>();
  const normalized: TVResolution[] = [];

  for (const item of values) {
    if (typeof item !== "string" || !isValidTVResolution(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    normalized.push(item);
  }

  return normalized.length > 0 ? normalized : [...DEFAULT_PINNED_INTERVALS];
}
