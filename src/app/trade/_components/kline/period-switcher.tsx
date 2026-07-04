"use client";

import {
  KLINE_INTERVALS,
  type KlineInterval,
} from "@/app/trade/_types/kline";

interface PeriodSwitcherProps {
  value: KlineInterval;
  onChange: (value: KlineInterval) => void;
  disabled?: boolean;
}

export function PeriodSwitcher({
  value,
  onChange,
  disabled,
}: PeriodSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs">
      {KLINE_INTERVALS.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.value)}
            className={`min-w-[44px] rounded-full px-3 py-1.5 transition ${
              active
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-foreground"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
