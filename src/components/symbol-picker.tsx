"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TradingPairsService } from "@/services/trading-pairs-service";
import type { TradingPair } from "@/types/trading-pair";
import { normalizeTradingPair } from "@/utils/symbol";
import { toast } from "@/services/toast";
import { useTranslation } from "@/i18n/use-translation";

type SymbolPickerProps = {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
};

const FALLBACK: TradingPair[] = [
  {
    id: 1,
    baseAsset: "BTC",
    symbol: "BTCUSDT",
    exchange: "binance",
    displayName: "Bitcoin",
    sortOrder: 10,
    isDefault: true,
    accessTier: 0,
    status: 1,
  },
  {
    id: 2,
    baseAsset: "ETH",
    symbol: "ETHUSDT",
    exchange: "binance",
    displayName: "Ethereum",
    sortOrder: 20,
    isDefault: false,
    accessTier: 0,
    status: 1,
  },
  {
    id: 3,
    baseAsset: "SOL",
    symbol: "SOLUSDT",
    exchange: "binance",
    displayName: "Solana",
    sortOrder: 30,
    isDefault: false,
    accessTier: 0,
    status: 1,
  },
];

export function SymbolPicker({ value, onChange, className = "" }: SymbolPickerProps) {
  const t = useTranslation();
  const [pairs, setPairs] = useState<TradingPair[]>(FALLBACK);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void TradingPairsService.list()
      .then((list) => {
        if (list.length > 0) setPairs(list);
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const allowed = pairs.map((p) => p.symbol);
  const active = normalizeTradingPair(
    value,
    allowed,
    pairs.find((p) => p.isDefault)?.symbol ?? "BTCUSDT",
  );
  const current = pairs.find((p) => p.symbol === active) ?? pairs[0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
          ₿
        </span>
        {active}
        <span className="text-xs font-normal text-muted">Binance</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open ? (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-64 min-w-[10rem] overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg">
          {pairs.map((pair) => (
            <li key={pair.symbol}>
              <button
                type="button"
                disabled={pair.locked}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 ${
                  pair.symbol === active ? "font-semibold text-accent" : "text-foreground"
                }`}
                onClick={() => {
                  if (pair.locked) {
                    toast.info(t("adminSymbols.accessVip"));
                    return;
                  }
                  onChange(pair.symbol);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-1.5">
                  {pair.symbol}
                  {pair.accessTier === 1 ? (
                    <span className="rounded bg-amber-500/10 px-1 text-[10px] text-amber-600">VIP</span>
                  ) : null}
                </span>
                <span className="text-xs text-muted">{pair.displayName || pair.baseAsset}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!current ? null : (
        <span className="sr-only">{current.displayName}</span>
      )}
    </div>
  );
}
