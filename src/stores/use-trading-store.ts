"use client";

import { create } from "zustand";
import {
  AccountService,
  type ServerBalance,
  type ServerLedgerEntry,
} from "@/services/account-service";
import {
  SpotService,
  type ServerSpotOrder,
  type ServerSpotTrade,
} from "@/services/spot-service";
import { ApiClientError } from "@/services/api-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { getAccessTokenCookie } from "@/utils/auth-cookie";
import type {
  Balance,
  ExchangeOrder,
  LedgerEntry,
  OrderSide,
  OrderType,
  UserTrade,
} from "@/types/exchange";

interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number | null;
  quantity: number;
}

interface TradingState {
  balances: Balance[];
  openOrders: ExchangeOrder[];
  orderHistory: ExchangeOrder[];
  userTrades: UserTrade[];
  ledger: LedgerEntry[];
  loaded: boolean;
  hydrate: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  clearForLogout: () => void;
  placeOrder: (input: PlaceOrderInput) => Promise<{ ok: boolean; message?: string }>;
  cancelOrder: (orderNo: string) => Promise<void>;
  cancelAll: (symbol?: string) => Promise<void>;
}

function toBalance(b: ServerBalance): Balance {
  return { currency: b.currency, available: b.available, frozen: b.frozen };
}

function toOrder(o: ServerSpotOrder): ExchangeOrder {
  return {
    id: o.orderNo,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    price: o.price,
    quantity: o.quantity,
    filledQuantity: o.filledQuantity,
    status: o.status,
    createdAt: o.createdAt,
  };
}

function toTrade(t: ServerSpotTrade): UserTrade {
  return {
    id: t.tradeNo,
    orderId: t.orderNo,
    symbol: t.symbol,
    side: t.side,
    price: t.price,
    quantity: t.quantity,
    fee: t.fee,
    feeCurrency: t.feeCurrency,
    role: t.role,
    ts: t.ts,
  };
}

function toLedger(l: ServerLedgerEntry): LedgerEntry {
  return {
    id: String(l.id),
    currency: l.currency,
    type: l.type,
    amount: l.amount,
    balanceAfter: l.balanceAfter,
    refId: l.refId,
    ts: l.ts,
  };
}

export const useTradingStore = create<TradingState>()((set, get) => ({
  balances: [],
  openOrders: [],
  orderHistory: [],
  userTrades: [],
  ledger: [],
  loaded: false,

  clearForLogout: () =>
    set({
      balances: [],
      openOrders: [],
      orderHistory: [],
      userTrades: [],
      ledger: [],
      loaded: false,
    }),

  hydrate: async () => {
    const { user, hydrated } = useAuthStore.getState();
    if (!hydrated) return;
    if (!user && !getAccessTokenCookie()) {
      get().clearForLogout();
      set({ loaded: true });
      return;
    }
    if (!user) {
      set({ loaded: true });
      return;
    }

    try {
      const [balances, open, history, trades, ledger] = await Promise.all([
        AccountService.getBalances(),
        SpotService.openOrders(),
        SpotService.historyOrders({ pageSize: 100 }),
        SpotService.trades({ pageSize: 100 }),
        AccountService.getLedger({ pageSize: 100 }),
      ]);
      set({
        balances: balances.balances.map(toBalance),
        openOrders: open.data.map(toOrder),
        orderHistory: history.data.map(toOrder),
        userTrades: trades.data.map(toTrade),
        ledger: ledger.data.map(toLedger),
        loaded: true,
      });
    } catch {
      // 未登录 / 后端不可用：保持空数据
      set({ loaded: true });
    }
  },

  refreshBalances: async () => {
    if (!useAuthStore.getState().user) return;
    try {
      const res = await AccountService.getBalances();
      set({ balances: res.balances.map(toBalance) });
    } catch {
      /* ignore */
    }
  },

  refreshOrders: async () => {
    if (!useAuthStore.getState().user) return;
    try {
      const [open, history, trades] = await Promise.all([
        SpotService.openOrders(),
        SpotService.historyOrders({ pageSize: 100 }),
        SpotService.trades({ pageSize: 100 }),
      ]);
      set({
        openOrders: open.data.map(toOrder),
        orderHistory: history.data.map(toOrder),
        userTrades: trades.data.map(toTrade),
      });
    } catch {
      /* ignore */
    }
  },

  placeOrder: async (input) => {
    try {
      await SpotService.placeOrder(input);
      await get().hydrate();
      return { ok: true };
    } catch (e) {
      const message =
        e instanceof ApiClientError ? e.message : "下单失败，请稍后再试";
      return { ok: false, message };
    }
  },

  cancelOrder: async (orderNo) => {
    await SpotService.cancelOrder(orderNo);
    await get().hydrate();
  },

  cancelAll: async (symbol) => {
    const targets = get().openOrders.filter(
      (o) => !symbol || o.symbol === symbol,
    );
    await Promise.allSettled(
      targets.map((o) => SpotService.cancelOrder(o.id)),
    );
    await get().hydrate();
  },
}));
