"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { displayPair } from "@/utils/format-exchange";
import { PriceChange } from "@/components/exchange/price-change";

export function CommandPalette() {
  const t = useExchangeT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const tickers = useMockMarketStore((s) => s.tickers);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("velora:command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("velora:command-palette", onOpen);
    };
  }, []);

  const items = useMemo(() => {
    const nav = [
      { label: t("markets.title"), href: "/markets" },
      { label: t("trade.spot"), href: "/trade/BTC-USDT" },
      { label: t("trade.futures"), href: "/futures/BTC-USDT" },
      { label: t("assets.title"), href: "/assets" },
      { label: t("orders.title"), href: "/orders" },
      { label: t("announcements.title"), href: "/announcements" },
      { label: t("user.overview"), href: "/user" },
      { label: t("user.kyc"), href: "/user/kyc" },
      { label: t("user.security"), href: "/user/security" },
      { label: t("user.preferences"), href: "/user/preferences" },
    ];
    const symbols = MOCK_SYMBOLS.filter(
      (s) =>
        !q ||
        s.symbol.toLowerCase().includes(q.toLowerCase()) ||
        s.base.toLowerCase().includes(q.toLowerCase()),
    ).map((s) => ({
      label: displayPair(s.symbol),
      href: `/trade/${s.symbol}`,
      change: tickers[s.symbol]?.change24h ?? 0,
    }));
    return { nav, symbols };
  }, [q, t, tickers]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
    setQ("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-panel w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("trade.commandHint")}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted">
            {t("markets.pair")}
          </p>
          {items.symbols.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
            >
              <span>{item.label}</span>
              <PriceChange value={item.change} className="text-xs" />
            </button>
          ))}
          <p className="mt-2 px-2 py-1 text-[10px] uppercase tracking-wide text-muted">
            Menu
          </p>
          {items.nav.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteButton() {
  const t = useExchangeT();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("velora:command-palette"))}
      className="hidden items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs text-muted hover:text-foreground md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span>{t("trade.command")}</span>
      <kbd className="rounded bg-surface px-1 text-[10px]">⌘K</kbd>
    </button>
  );
}
