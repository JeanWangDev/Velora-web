"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_BALANCES,
  INITIAL_LEDGER,
  INITIAL_OPEN_ORDERS,
  INITIAL_ORDER_HISTORY,
  INITIAL_USER_TRADES,
  getSymbolMeta,
} from "@/mocks/exchange-data";
import type {
  Balance,
  ExchangeOrder,
  LedgerEntry,
  OrderSide,
  OrderType,
  UserTrade,
} from "@/types/exchange";
import { useMockMarketStore } from "@/stores/use-mock-market-store";

interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number | null;
  quantity: number;
}

interface MockTradingState {
  balances: Balance[];
  openOrders: ExchangeOrder[];
  orderHistory: ExchangeOrder[];
  userTrades: UserTrade[];
  ledger: LedgerEntry[];
  placeOrder: (input: PlaceOrderInput) => { ok: boolean; message?: string };
  cancelOrder: (orderId: string) => void;
  cancelAll: (symbol?: string) => void;
  /** 演示充值 */
  credit: (currency: string, amount: number) => void;
  /** 演示提现（需调用方先校验 KYC） */
  withdraw: (currency: string, amount: number) => { ok: boolean; message?: string };
}

function findBalance(balances: Balance[], currency: string): Balance | undefined {
  return balances.find((b) => b.currency === currency);
}

function updateBalance(
  balances: Balance[],
  currency: string,
  patch: Partial<Balance>,
): Balance[] {
  return balances.map((b) => (b.currency === currency ? { ...b, ...patch } : b));
}

export const useMockTradingStore = create<MockTradingState>()(
  persist(
    (set, get) => ({
      balances: INITIAL_BALANCES,
      openOrders: INITIAL_OPEN_ORDERS,
      orderHistory: INITIAL_ORDER_HISTORY,
      userTrades: INITIAL_USER_TRADES,
      ledger: INITIAL_LEDGER,

      placeOrder: (input) => {
        const meta = getSymbolMeta(input.symbol);
        if (!meta) return { ok: false, message: "invalid symbol" };
        if (input.quantity < meta.minQty) return { ok: false, message: "min qty" };

        const tickers = useMockMarketStore.getState().tickers;
        const last = tickers[input.symbol]?.last ?? input.price ?? 0;
        const execPrice =
          input.type === "market" ? last : (input.price ?? last);
        const quoteAmount = execPrice * input.quantity;

        const { balances } = get();
        const quote = findBalance(balances, meta.quote);
        const base = findBalance(balances, meta.base);

        if (input.side === "buy") {
          if (!quote || quote.available < quoteAmount) {
            return { ok: false, message: "insufficient" };
          }
        } else if (!base || base.available < input.quantity) {
          return { ok: false, message: "insufficient" };
        }

        const orderId = `ord-${Date.now()}`;
        const now = Date.now();
        const filled = input.type === "market";

        const order: ExchangeOrder = {
          id: orderId,
          symbol: input.symbol,
          side: input.side,
          type: input.type,
          price: input.type === "limit" ? input.price : null,
          quantity: input.quantity,
          filledQuantity: filled ? input.quantity : 0,
          status: filled ? "filled" : "open",
          createdAt: now,
        };

        let nextBalances = [...balances];
        const nextTrades = [...get().userTrades];

        if (filled) {
          const fee = quoteAmount * 0.001;
          if (input.side === "buy") {
            nextBalances = updateBalance(nextBalances, meta.quote, {
              available: (quote?.available ?? 0) - quoteAmount - fee,
            });
            nextBalances = updateBalance(nextBalances, meta.base, {
              available: (base?.available ?? 0) + input.quantity,
            });
          } else {
            nextBalances = updateBalance(nextBalances, meta.base, {
              available: (base?.available ?? 0) - input.quantity,
            });
            nextBalances = updateBalance(nextBalances, meta.quote, {
              available: (quote?.available ?? 0) + quoteAmount - fee,
            });
          }
          nextTrades.unshift({
            id: `trd-${now}`,
            orderId,
            symbol: input.symbol,
            side: input.side,
            price: execPrice,
            quantity: input.quantity,
            fee,
            feeCurrency: meta.quote,
            role: "taker",
            ts: now,
          });
        } else if (input.side === "buy") {
          nextBalances = updateBalance(nextBalances, meta.quote, {
            available: (quote?.available ?? 0) - quoteAmount,
            frozen: (quote?.frozen ?? 0) + quoteAmount,
          });
        } else {
          nextBalances = updateBalance(nextBalances, meta.base, {
            available: (base?.available ?? 0) - input.quantity,
            frozen: (base?.frozen ?? 0) + input.quantity,
          });
        }

        set({
          balances: nextBalances,
          openOrders: filled ? get().openOrders : [order, ...get().openOrders],
          orderHistory: [order, ...get().orderHistory],
          userTrades: nextTrades,
        });

        return { ok: true };
      },

      cancelOrder: (orderId) => {
        const order = get().openOrders.find((o) => o.id === orderId);
        if (!order) return;
        const meta = getSymbolMeta(order.symbol);
        if (!meta) return;

        const remaining = order.quantity - order.filledQuantity;
        let nextBalances = [...get().balances];

        if (order.side === "buy" && order.price) {
          const amt = order.price * remaining;
          const q = findBalance(nextBalances, meta.quote);
          nextBalances = updateBalance(nextBalances, meta.quote, {
            available: (q?.available ?? 0) + amt,
            frozen: Math.max(0, (q?.frozen ?? 0) - amt),
          });
        } else {
          const b = findBalance(nextBalances, meta.base);
          nextBalances = updateBalance(nextBalances, meta.base, {
            available: (b?.available ?? 0) + remaining,
            frozen: Math.max(0, (b?.frozen ?? 0) - remaining),
          });
        }

        set({
          balances: nextBalances,
          openOrders: get().openOrders.filter((o) => o.id !== orderId),
          orderHistory: get().orderHistory.map((o) =>
            o.id === orderId ? { ...o, status: "cancelled" } : o,
          ),
        });
      },

      cancelAll: (symbol) => {
        const toCancel = get().openOrders.filter(
          (o) => !symbol || o.symbol === symbol,
        );
        toCancel.forEach((o) => get().cancelOrder(o.id));
      },

      credit: (currency, amount) => {
        if (amount <= 0) return;
        const balances = get().balances;
        const existing = findBalance(balances, currency);
        const nextAvailable = (existing?.available ?? 0) + amount;
        const nextBalances = existing
          ? updateBalance(balances, currency, { available: nextAvailable })
          : [...balances, { currency, available: amount, frozen: 0 }];
        const entry: LedgerEntry = {
          id: `lg-${Date.now()}`,
          currency,
          type: "deposit",
          amount,
          balanceAfter: nextAvailable + (existing?.frozen ?? 0),
          refId: `dep-${Date.now()}`,
          ts: Date.now(),
        };
        set({ balances: nextBalances, ledger: [entry, ...get().ledger] });
      },

      withdraw: (currency, amount) => {
        if (amount <= 0) return { ok: false, message: "invalid amount" };
        const balances = get().balances;
        const existing = findBalance(balances, currency);
        if (!existing || existing.available < amount) {
          return { ok: false, message: "insufficient" };
        }
        const nextAvailable = existing.available - amount;
        const nextBalances = updateBalance(balances, currency, {
          available: nextAvailable,
        });
        const entry: LedgerEntry = {
          id: `lg-${Date.now()}`,
          currency,
          type: "withdraw",
          amount: -amount,
          balanceAfter: nextAvailable + existing.frozen,
          refId: `wd-${Date.now()}`,
          ts: Date.now(),
        };
        set({ balances: nextBalances, ledger: [entry, ...get().ledger] });
        return { ok: true };
      },
    }),
    { name: "velora-mock-trading" },
  ),
);
