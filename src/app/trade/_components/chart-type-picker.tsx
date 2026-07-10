"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChartCandlestick } from "lucide-react";
import {
  CHART_TYPE_OPTIONS,
  chartTypeLabelKey,
} from "@/app/trade/_config/chart-types";
import type { TVSeriesStyle } from "@/app/trade/_types/chart";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";

type ChartTypePickerProps = {
  value: TVSeriesStyle;
  onChange: (value: TVSeriesStyle) => void;
  disabled?: boolean;
  variant?: "default" | "terminal";
};

export function ChartTypePicker({
  value,
  onChange,
  disabled = false,
  variant = "default",
}: ChartTypePickerProps) {
  const t = useTranslation();
  const isTerminal = variant === "terminal";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 text-xs">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t(chartTypeLabelKey(value))}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-0.5 rounded border px-2 py-1 transition disabled:cursor-not-allowed disabled:opacity-40",
          open
            ? isTerminal
              ? "border-[var(--terminal-accent)]/50 bg-[var(--terminal-panel)] text-[var(--terminal-text)]"
              : "border-accent/40 bg-accent/5 text-accent"
            : isTerminal
              ? "border-[var(--terminal-border)] text-[var(--terminal-muted)] hover:border-[var(--terminal-border-strong)] hover:text-[var(--terminal-text)]"
              : "border-border text-muted hover:border-accent/40 hover:text-foreground",
        )}
      >
        <ChartCandlestick className="h-3.5 w-3.5 shrink-0" />
        {!isTerminal ? <span>{t(chartTypeLabelKey(value))}</span> : null}
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 top-full z-50 mt-1 min-w-[10.5rem] rounded-lg border py-1 shadow-lg",
            isTerminal
              ? "border-[var(--terminal-border)] bg-[var(--terminal-bg)]"
              : "border-border bg-surface",
          )}
        >
          {CHART_TYPE_OPTIONS.map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition",
                  active
                    ? isTerminal
                      ? "bg-[var(--terminal-accent)]/10 font-medium text-[var(--terminal-accent)]"
                      : "bg-accent/10 font-medium text-accent"
                    : isTerminal
                      ? "text-[var(--terminal-text)] hover:bg-[var(--terminal-panel)]"
                      : "text-foreground hover:bg-surface-muted",
                )}
              >
                <span>{t(item.labelKey)}</span>
                {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
