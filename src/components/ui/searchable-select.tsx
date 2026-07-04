"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  sectionTitle?: string;
  emptyText?: string;
}

/**
 * OKX 风格可搜索下拉（认证页国家选择等）。
 * 需放在 `.auth-form` 容器内，样式走全局 token。
 */
export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "请选择",
  searchPlaceholder = "搜索",
  sectionTitle,
  emptyText = "无匹配结果",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <label className="auth-label mb-2 block text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("auth-trigger", open && "is-open")}
      >
        {selected ? (
          <span className="flex items-center gap-2.5">
            {selected.icon && (
              <span className="auth-flag">{selected.icon}</span>
            )}
            <span>{selected.label}</span>
          </span>
        ) : (
          <span className="auth-placeholder">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="auth-dropdown">
          <div className="px-3 pt-3 pb-2">
            <div className="auth-search-wrap">
              <Search className="auth-search-icon" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="auth-search"
              />
            </div>
          </div>
          {sectionTitle && (
            <p className="auth-dropdown-section">{sectionTitle}</p>
          )}
          <div className="max-h-52 overflow-y-auto pb-2">
            {filtered.length === 0 && (
              <p className="auth-muted px-4 py-6 text-center text-sm">
                {emptyText}
              </p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "auth-dropdown-item",
                  o.value === value && "is-active",
                )}
              >
                {o.icon && <span className="auth-flag">{o.icon}</span>}
                <span>{o.label}</span>
                {o.value === value && <Check className="ml-auto h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
