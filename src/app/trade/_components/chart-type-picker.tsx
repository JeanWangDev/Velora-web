"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  CHART_TYPE_OPTIONS,
  chartTypeLabelKey,
} from "@/app/trade/_config/chart-types";
import type { TVSeriesStyle } from "@/app/trade/_types/chart";
import { useTranslation } from "@/i18n/use-translation";

type ChartTypePickerProps = {
  value: TVSeriesStyle;
  onChange: (value: TVSeriesStyle) => void;
  disabled?: boolean;
};

export function ChartTypePicker({
  value,
  onChange,
  disabled = false,
}: ChartTypePickerProps) {
  const t = useTranslation();
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
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-0.5 rounded border px-2 py-1 transition ${
          open
            ? "border-accent/40 bg-accent/5 text-accent"
            : "border-border text-muted hover:border-accent/40 hover:text-foreground"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span>{t(chartTypeLabelKey(value))}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 min-w-[9.5rem] rounded-lg border border-border bg-surface py-1 shadow-lg"
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
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition ${
                  active
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-foreground hover:bg-surface-muted"
                }`}
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
