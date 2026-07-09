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
  const dragging = useRef(false);

  const pickFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const pct = Math.round(Math.min(100, Math.max(0, ratio * 100)));
      onChange(pct);
    },
    [onChange],
  );

  const onDragStart = useCallback(
    (clientX: number) => {
      dragging.current = true;
      pickFromClientX(clientX);

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        pickFromClientX(ev.clientX);
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "pointer";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pickFromClientX],
  );

  const accentFill = side === "buy" ? "bg-up" : "bg-down";

  return (
    <div className="select-none px-0.5 py-1">
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="relative mx-1.5 h-8 cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart(e.clientX);
        }}
      >
        {/* 轨道底线 */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--terminal-border)]" />

        {/* 已选进度 */}
        <div
          className={cn(
            "absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-[width]",
            value > 0 ? "bg-[var(--terminal-text)]" : accentFill,
          )}
          style={{ width: `${value}%` }}
        />

        {/* 刻度圆点 */}
        {STEPS.map((step) => {
          const passed = value >= step;
          return (
            <button
              key={step}
              type="button"
              style={{ left: `${step}%` }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onChange(step);
              }}
              className="absolute top-1/2 z-[1] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              aria-label={`${step}%`}
            >
              <span
                className={cn(
                  "rounded-full border transition-all",
                  passed
                    ? "h-2 w-2 border-[var(--terminal-text)] bg-[var(--terminal-bg)]"
                    : "h-1.5 w-1.5 border-[var(--terminal-border)] bg-[var(--terminal-bg)]",
                )}
              />
            </button>
          );
        })}

        {/* 可拖拽滑块 */}
        <button
          type="button"
          style={{ left: `${value}%` }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDragStart(e.clientX);
          }}
          className={cn(
            "absolute top-1/2 z-[2] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--terminal-text)] bg-[var(--terminal-text)] shadow-sm transition-transform hover:scale-110",
            value === 0 && "opacity-0 pointer-events-none",
          )}
          aria-hidden={value === 0}
        >
          <span className="absolute inset-[3px] rounded-full bg-[var(--terminal-bg)]" />
        </button>
      </div>

      <div className="mt-0.5 flex justify-between px-0.5">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              "min-w-[1.75rem] text-center text-[10px] tabular-nums transition",
              Math.abs(value - step) <= 2 || value === step
                ? "text-[var(--terminal-text)]"
                : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
            )}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
}
