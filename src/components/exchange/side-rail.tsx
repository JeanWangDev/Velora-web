"use client";

import {
  BookOpen,
  ClipboardList,
  History,
  ScrollText,
  Settings2,
} from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import {
  useSideRailStore,
  type SideRailPanel,
} from "@/stores/use-side-rail-store";
import { OrderBookView } from "@/components/exchange/order-book";
import { OrderForm } from "@/components/exchange/order-form";
import { RecentTradesView } from "@/components/exchange/recent-trades";
import { OpenOrdersPanel } from "@/components/exchange/open-orders-panel";
import { TradeHistoryPanel } from "@/components/exchange/trade-history-panel";
import type { OrderBook } from "@/types/exchange";
import type { MarketTrade } from "@/types/exchange";

const PANELS: {
  id: Exclude<SideRailPanel, null>;
  icon: typeof BookOpen;
}[] = [
  { id: "orderbook", icon: BookOpen },
  { id: "order", icon: ScrollText },
  { id: "openOrders", icon: ClipboardList },
  { id: "trades", icon: History },
  { id: "settings", icon: Settings2 },
];

interface SideRailProps {
  symbol: string;
  lastPrice: number;
  book: OrderBook;
  trades: MarketTrade[];
}

export function SideRail({ symbol, lastPrice, book, trades }: SideRailProps) {
  const t = useExchangeT();
  const { active, toggle } = useSideRailStore();

  const title = (id: Exclude<SideRailPanel, null>) => {
    const map: Record<string, string> = {
      orderbook: t("trade.orderBook"),
      order: t("trade.placeOrder"),
      openOrders: t("trade.openOrders"),
      trades: t("trade.recentTrades"),
      settings: t("trade.settings"),
    };
    return map[id];
  };

  return (
    <>
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-l border-border bg-surface/60 py-3">
        {PANELS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={title(id)}
            onClick={() => toggle(id)}
            className={`rounded-xl p-2 transition ${
              active === id
                ? "bg-primary/20 text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </aside>

      {active && (
        <aside className="flex w-[min(360px,40vw)] shrink-0 flex-col border-l border-border bg-surface/95">
          <header className="border-b border-border px-4 py-3 text-sm font-medium">
            {title(active)}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {active === "orderbook" && (
              <OrderBookView symbol={symbol} book={book} />
            )}
            {active === "order" && (
              <OrderForm symbol={symbol} lastPrice={lastPrice} />
            )}
            {active === "openOrders" && <OpenOrdersPanel symbol={symbol} />}
            {active === "trades" && (
              <RecentTradesView symbol={symbol} trades={trades} />
            )}
            {active === "settings" && (
              <TradeHistoryPanel symbol={symbol} />
            )}
          </div>
        </aside>
      )}
    </>
  );
}
