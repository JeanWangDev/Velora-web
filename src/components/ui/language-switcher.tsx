"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Globe, Info, Search } from "lucide-react";
import { useLocale } from "@/i18n/use-translation";
import { useSwitchUrlLocale, useUrlLocale } from "@/i18n/locale-path";
import {
  URL_LOCALE_LABELS,
  URL_LOCALES,
  type UrlLocale,
} from "@/i18n/locales";
import {
  usePreferencesStore,
  type FiatCurrency,
} from "@/stores/use-preferences-store";
import { cn } from "@/lib/cn";

const CURRENCIES: FiatCurrency[] = [
  "CNY",
  "USD",
  "RUB",
  "JPY",
  "EUR",
  "VND",
  "IDR",
  "PHP",
  "INR",
];

export function LanguageSwitcher() {
  const dictLocale = useLocale();
  const urlLocale = useUrlLocale();
  const switchUrlLocale = useSwitchUrlLocale();
  const fiatCurrency = usePreferencesStore((s) => s.fiatCurrency);
  const setFiatCurrency = usePreferencesStore((s) => s.setFiatCurrency);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [langQ, setLangQ] = useState("");
  const [curQ, setCurQ] = useState("");
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const langs = URL_LOCALES.filter((code) => {
    const label = URL_LOCALE_LABELS[code];
    const q = langQ.trim().toLowerCase();
    if (!q) return true;
    return (
      label.toLowerCase().includes(q) || code.toLowerCase().includes(q)
    );
  });

  const currencies = CURRENCIES.filter((c) =>
    c.toLowerCase().includes(curQ.trim().toLowerCase()),
  );

  const isZh = dictLocale === "zh";

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[200] flex h-[420px] w-[520px] overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-2xl"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="flex min-w-0 flex-1 flex-col border-r border-border p-4">
              <div className="mb-3 flex items-center gap-1 text-sm font-semibold">
                {isZh ? "语言" : "Language"}
                <Info className="h-3.5 w-3.5 text-muted" />
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={langQ}
                  onChange={(e) => setLangQ(e.target.value)}
                  placeholder={isZh ? "搜索" : "Search"}
                  className="w-full rounded-lg bg-surface-muted py-2 pl-8 pr-3 text-xs outline-none placeholder:text-muted"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {langs.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      switchUrlLocale(code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-surface-muted",
                      code === urlLocale && "bg-surface-muted",
                    )}
                  >
                    <span>
                      {URL_LOCALE_LABELS[code]}
                      <span className="ml-2 text-[10px] text-muted">
                        /{code}
                      </span>
                    </span>
                    {code === urlLocale && (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-4">
              <div className="mb-3 text-sm font-semibold">
                {isZh ? "本地货币" : "Local currency"}
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={curQ}
                  onChange={(e) => setCurQ(e.target.value)}
                  placeholder={isZh ? "搜索" : "Search"}
                  className="w-full rounded-lg bg-surface-muted py-2 pl-8 pr-3 text-xs outline-none placeholder:text-muted"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {currencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFiatCurrency(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-surface-muted",
                      c === fiatCurrency && "bg-surface-muted",
                    )}
                  >
                    <span className="font-mono">{c}</span>
                    {c === fiatCurrency && (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Language and currency"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground",
          open && "bg-surface-muted text-foreground ring-1 ring-border",
        )}
      >
        <Globe className="h-4 w-4" />
      </button>
      {panel}
    </>
  );
}
