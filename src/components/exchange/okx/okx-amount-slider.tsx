"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/cn";

const STEPS = [0, 25, 50, 75, 100] as const;

export function OkxAmountSlider({
  value,
  onChange,
  side = "buy",
}: {
  value: number;
  onChange: (pct: number) => void;
  side?: "buy" | "sell";
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const snap = useCallback((raw: number) => {
    const clamped = Math.min(100, Math.max(0, raw));
    return STEPS.reduce((prev, cur) =>
      Math.abs(cur - clamped) < Math.abs(prev - clamped) ? cur : prev,
    );
  }, []);

  const pickFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      onChange(snap(ratio * 100));
    },
    [onChange, snap],
  );

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pickFromPointer(e.clientX);
  };

  const onTrackPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pickFromPointer(e.clientX);
  };

  const accentBorder = side === "buy" ? "border-up/70" : "border-down/70";
  const accentFill = side === "buy" ? "bg-up/50" : "bg-down/50";

  return (
    <div className="select-none px-0.5 py-1">
      <div
        ref={trackRef}
        className="relative mx-1.5 touch-none"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
      >
        <div className="absolute inset-x-0 top-[7px] h-px bg-[#333]" />

        <div
          className={cn("absolute left-0 top-[7px] h-px transition-[width]", accentFill)}
          style={{ width: `${value}%` }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const active = value >= step;
            const current = value === step;
            return (
              <button
                key={step}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(step);
                }}
                className="group relative z-[1] flex h-4 w-4 items-center justify-center"
                aria-label={`${step}%`}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full border transition-all",
                    current
                      ? "h-3.5 w-3.5 border-foreground bg-foreground"
                      : active
                        ? cn("h-2.5 w-2.5 border-foreground/80 bg-[#0a0a0a]", accentBorder)
                        : "h-2 w-2 border-[#555] bg-[#0a0a0a] group-hover:border-[#888]",
                  )}
                >
                  {current && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0a0a0a]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-0.5 flex justify-between px-0.5">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              "min-w-[1.75rem] text-center text-[10px] tabular-nums transition",
              value === step ? "text-foreground" : "text-muted hover:text-foreground/80",
            )}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
}
