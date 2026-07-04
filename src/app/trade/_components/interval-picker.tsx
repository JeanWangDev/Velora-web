"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Pin, Settings2 } from "lucide-react";
import type { TVResolution } from "@/app/trade/_types/chart";
import {
  ALL_INTERVAL_OPTIONS,
  INTERVAL_GROUPS,
  intervalLabel,
} from "@/app/trade/_config/intervals";
import { usePinnedIntervals } from "@/app/trade/_hooks/use-pinned-intervals";
import { useTranslation } from "@/i18n/use-translation";

type IntervalPickerProps = {
  value: TVResolution;
  onChange: (value: TVResolution) => void;
  variant?: "default" | "terminal";
};

export function IntervalPicker({ value, onChange, variant = "default" }: IntervalPickerProps) {
  const t = useTranslation();
  const isTerminal = variant === "terminal";
  const { pinned, togglePinned, hydrated } = usePinnedIntervals();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setEditMode(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const pinnedButtons = hydrated ? pinned : ALL_INTERVAL_OPTIONS.slice(0, 6).map((i) => i.value);
  const showCurrentBadge =
    hydrated && !pinnedButtons.includes(value);

  return (
    <div ref={rootRef} className="relative flex items-center gap-0.5 text-xs">
      {pinnedButtons.map((item) => {
        const active = item === value;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded px-2 py-1 transition ${
              active
                ? isTerminal
                  ? "bg-[#1c1c1c] font-semibold text-foreground"
                  : "bg-accent/10 font-semibold text-accent"
                : isTerminal
                  ? "text-muted hover:bg-[#141414] hover:text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {intervalLabel(item)}
          </button>
        );
      })}

      {showCurrentBadge ? (
        <span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
          {intervalLabel(value)}
        </span>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((prev) => !prev);
          if (open) setEditMode(false);
        }}
        className={`ml-1 flex items-center gap-0.5 rounded border px-2 py-1 transition ${
          open
            ? "border-accent/40 bg-accent/5 text-accent"
            : isTerminal
              ? "border-[var(--terminal-border)] text-muted hover:text-foreground"
              : "border-border text-muted hover:border-accent/40 hover:text-foreground"
        }`}
      >
        <span>{t("trade.intervals.all")}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className={`absolute left-0 top-full z-50 mt-1 w-[min(92vw,22rem)] rounded-lg border p-3 shadow-lg ${
          isTerminal
            ? "border-[var(--terminal-border)] bg-[#0a0a0a]"
            : "border-border bg-surface"
        }`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("trade.intervals.selectTitle")}
            </span>
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] transition ${
                editMode
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {editMode ? t("trade.intervals.done") : t("trade.intervals.edit")}
            </button>
          </div>

          {editMode ? (
            <p className="mb-3 text-[11px] text-muted">{t("trade.intervals.editHint")}</p>
          ) : null}

          <div className="max-h-[min(50vh,20rem)] space-y-3 overflow-y-auto pr-1">
            {INTERVAL_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="mb-1.5 text-[11px] font-medium text-muted">
                  {t(group.labelKey)}
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                  {group.items.map((item) => {
                    const active = item.value === value;
                    const isPinned = pinned.includes(item.value);

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          if (editMode) {
                            togglePinned(item.value);
                            return;
                          }
                          onChange(item.value);
                          setOpen(false);
                          setEditMode(false);
                        }}
                        className={`relative flex items-center justify-center rounded px-2 py-1.5 text-xs transition ${
                          active && !editMode
                            ? "bg-accent/10 font-semibold text-accent"
                            : "bg-surface-muted/60 text-foreground hover:bg-surface-muted"
                        } ${editMode && isPinned ? "ring-1 ring-accent/40" : ""}`}
                      >
                        {item.label}
                        {editMode ? (
                          <span className="absolute -right-1 -top-1 rounded-full bg-surface p-0.5 shadow-sm">
                            {isPinned ? (
                              <Check className="h-2.5 w-2.5 text-accent" />
                            ) : (
                              <Pin className="h-2.5 w-2.5 text-muted" />
                            )}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
