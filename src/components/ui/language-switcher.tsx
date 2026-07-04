"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Globe, Info, Search } from "lucide-react";
import { useLocale, useSetLocale } from "@/i18n/use-translation";
import type { Locale } from "@/i18n/dictionaries";
import {
  usePreferencesStore,
  type FiatCurrency,
} from "@/stores/use-preferences-store";
import { cn } from "@/lib/cn";

const LANGUAGES: Array<{ code: Locale; label: string }> = [
  { code: "zh", label: "简体中文" },
  { code: "en", label: "English" },
];

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
  const locale = useLocale();
  const setLocale = useSetLocale();
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

  const langs = LANGUAGES.filter((l) =>
    l.label.toLowerCase().includes(langQ.trim().toLowerCase()),
  );
  const currencies = CURRENCIES.filter((c) =>
    c.toLowerCase().includes(curQ.trim().toLowerCase()),
  );

  const isZh = locale === "zh";

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[200] flex h-[420px] w-[520px] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white text-black shadow-2xl"
            style={{ top: pos.top, right: pos.right }}
          >
            {/* 语言 */}
            <div className="flex min-w-0 flex-1 flex-col border-r border-[#eee] p-4">
              <div className="mb-3 flex items-center gap-1 text-sm font-semibold">
                {isZh ? "语言" : "Language"}
                <Info className="h-3.5 w-3.5 text-[#999]" />
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
                <input
                  value={langQ}
                  onChange={(e) => setLangQ(e.target.value)}
                  placeholder={isZh ? "搜索" : "Search"}
                  className="w-full rounded-lg bg-[#f5f5f5] py-2 pl-8 pr-3 text-xs outline-none placeholder:text-[#999]"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLocale(l.code)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-[#f5f5f5]",
                      l.code === locale && "bg-[#f5f5f5]",
                    )}
                  >
                    <span>{l.label}</span>
                    {l.code === locale && (
                      <Check className="h-4 w-4 text-black" strokeWidth={2.5} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 本地货币 */}
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <div className="mb-3 text-sm font-semibold">
                {isZh ? "本地货币" : "Local currency"}
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
                <input
                  value={curQ}
                  onChange={(e) => setCurQ(e.target.value)}
                  placeholder={isZh ? "搜索" : "Search"}
                  className="w-full rounded-lg bg-[#f5f5f5] py-2 pl-8 pr-3 text-xs outline-none placeholder:text-[#999]"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {currencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFiatCurrency(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-[#f5f5f5]",
                      c === fiatCurrency && "bg-[#f5f5f5]",
                    )}
                  >
                    <span className="font-mono">{c}</span>
                    {c === fiatCurrency && (
                      <Check className="h-4 w-4 text-black" strokeWidth={2.5} />
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
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-[#141414] hover:text-foreground",
          open && "bg-[#141414] text-foreground ring-1 ring-white/40",
        )}
      >
        <Globe className="h-4 w-4" />
      </button>
      {panel}
    </>
  );
}
