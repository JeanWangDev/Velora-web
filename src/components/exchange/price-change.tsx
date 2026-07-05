"use client";

import { cn } from "@/lib/cn";
import { formatPercent } from "@/utils/format-exchange";

export function PriceChange({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        up ? "text-up" : "text-down",
        className,
      )}
    >
      {formatPercent(value)}
    </span>
  );
}
