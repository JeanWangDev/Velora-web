"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Globe,
  Moon,
  Settings2,
  Sun,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { TVResolution } from "@/app/trade/_types/chart";
import { ChartStage } from "@/components/exchange/okx/chart-stage";
import { OkxOrderBookPanel } from "@/components/exchange/okx/okx-order-book-panel";
import { OkxSpotOrderForm } from "@/components/exchange/okx/okx-spot-order-form";
import { FuturesOrderForm } from "@/components/exchange/okx/futures-order-form";
import { InstrumentBar } from "@/components/exchange/terminal/instrument-bar";
import { BottomDesk } from "@/components/exchange/terminal/bottom-desk";
import { TickerTape } from "@/components/exchange/terminal/ticker-tape";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale, useSetLocale } from "@/i18n/use-translation";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { useTerminalStore } from "@/stores/use-terminal-store";
import type { TradeMode } from "@/stores/use-trade-mode-store";

export function TradeWorkspace({
  symbol,
  mode,
}: {
  symbol: string;
  mode: TradeMode;
}) {
  const t = useExchangeT();
  const [interval, setInterval] = useState<TVResolution>("15");
  const [fillLevel, setFillLevel] = useState<{
    price: number;
    qty: number;
  } | null>(null);
  const deskHeight = useTerminalStore((s) => s.bottomDeskHeight);

  const tickers = useMockMarketStore((s) => s.tickers);
  const orderBooks = useMockMarketStore((s) => s.orderBooks);
  const recentTrades = useMockMarketStore((s) => s.recentTrades);
  const ticker = tickers[symbol];
  const book = orderBooks[symbol];
  const trades = recentTrades[symbol] ?? [];

  if (!ticker) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div
      className="terminal-root flex h-[calc(100dvh-48px)] min-h-0 flex-col overflow-hidden bg-[var(--terminal-bg)]"
      style={{ ["--desk-h" as string]: `${deskHeight}px` }}
    >
      <InstrumentBar ticker={ticker} mode={mode} />

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: "minmax(0,1fr) 260px 300px 40px",
          gridTemplateRows: "minmax(0, 1fr)",
        }}
      >
        <div className="min-h-0 min-w-0 overflow-hidden">
          <ChartStage
            symbol={symbol}
            interval={interval}
            onIntervalChange={setInterval}
          />
        </div>

        <div className="flex h-full min-h-0 flex-col border-l border-[var(--terminal-border)]">
          {book ? (
            <OkxOrderBookPanel
              symbol={symbol}
              book={book}
              trades={trades}
              lastPrice={ticker.last}
              onLevelClick={setFillLevel}
            />
          ) : null}
        </div>

        <div className="min-h-0 overflow-y-auto border-l border-[var(--terminal-border)] bg-[#0a0a0a]">
          {mode === "spot" ? (
            <OkxSpotOrderForm
              symbol={symbol}
              lastPrice={ticker.last}
              fillLevel={fillLevel}
              onFillLevelConsumed={() => setFillLevel(null)}
            />
          ) : (
            <FuturesOrderForm
              symbol={symbol}
              lastPrice={ticker.last}
              fillLevel={fillLevel}
              onFillLevelConsumed={() => setFillLevel(null)}
            />
          )}
        </div>

        <OkxUtilityRail mode={mode} />
      </div>

      <BottomDesk symbol={symbol} />
      <TickerTape />
    </div>
  );
}

function OkxUtilityRail({ mode }: { mode: TradeMode }) {
  const t = useExchangeT();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const setBottomTab = useTerminalStore((s) => s.setBottomTab);

  const openOrders = useCallback(() => {
    setBottomTab("open");
  }, [setBottomTab]);

  return (
    <aside className="flex flex-col items-center gap-1 border-l border-[var(--terminal-border)] bg-[#0a0a0a] py-2">
      <HoverTooltip side="left" title={t("orders.title")}>
        <button
          type="button"
          onClick={openOrders}
          className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-[#141414] hover:text-foreground"
        >
          <ClipboardList className="h-4 w-4" />
        </button>
      </HoverTooltip>

      <div className="my-1 h-px w-6 bg-[var(--terminal-border)]" />

      <HoverTooltip side="left" title={t("user.language")}>
        <button
          type="button"
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-[#141414] hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
        </button>
      </HoverTooltip>

      <HoverTooltip side="left" title={t("user.theme")}>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-[#141414] hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </HoverTooltip>

      <HoverTooltip side="left" title={t("assets.title")}>
        <Link
          href="/assets"
          className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-[#141414] hover:text-foreground"
        >
          <Wallet className="h-4 w-4" />
        </Link>
      </HoverTooltip>

      <HoverTooltip side="left" title={t("user.preferences")}>
        <Link
          href="/user/preferences"
          className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-[#141414] hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </Link>
      </HoverTooltip>

      <div className="mt-auto px-1 text-center text-[9px] text-muted">
        {mode === "spot" ? "S" : "F"}
      </div>
    </aside>
  );
}
