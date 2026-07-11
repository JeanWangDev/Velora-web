"use client";

import { create } from "zustand";
import { FuturesService } from "@/services/futures-service";

export interface FuturesPosition {
  symbol: string;
  side: "long" | "short";
  marginMode: "cross" | "isolated";
  leverage: number;
  quantity: number;
  entryPrice: number;
  margin: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  markPrice: number;
}

export interface FuturesOrder {
  orderNo: string;
  symbol: string;
  side: "buy" | "sell";
  posSide: "long" | "short";
  type: "limit" | "market";
  price: number;
  quantity: number;
  filledQuantity: number;
  leverage: number;
  marginMode: "cross" | "isolated";
  reduceOnly: number;
  status: string;
  createdAt: number;
}

interface FuturesState {
  positions: FuturesPosition[];
  openOrders: FuturesOrder[];
  orderHistory: FuturesOrder[];
  loaded: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  cancelOrder: (orderNo: string) => Promise<void>;
  clearForLogout: () => void;
}

function mapPos(p: Record<string, unknown>): FuturesPosition {
  return {
    symbol: String(p.symbol),
    side: p.side as FuturesPosition["side"],
    marginMode: p.marginMode as FuturesPosition["marginMode"],
    leverage: Number(p.leverage),
    quantity: Number(p.quantity),
    entryPrice: Number(p.entryPrice),
    margin: Number(p.margin),
    unrealizedPnl: Number(p.unrealizedPnl),
    liquidationPrice: Number(p.liquidationPrice),
    markPrice: Number(p.markPrice ?? 0),
  };
}

function mapOrder(o: Record<string, unknown>): FuturesOrder {
  return {
    orderNo: String(o.orderNo),
    symbol: String(o.symbol),
    side: o.side as FuturesOrder["side"],
    posSide: o.posSide as FuturesOrder["posSide"],
    type: o.type as FuturesOrder["type"],
    price: Number(o.price),
    quantity: Number(o.quantity),
    filledQuantity: Number(o.filledQuantity ?? 0),
    leverage: Number(o.leverage),
    marginMode: o.marginMode as FuturesOrder["marginMode"],
    reduceOnly: Number(o.reduceOnly ?? 0),
    status: String(o.status),
    createdAt: Number(o.createdAt),
  };
}

export const useFuturesStore = create<FuturesState>()((set, get) => ({
  positions: [],
  openOrders: [],
  orderHistory: [],
  loaded: false,

  hydrate: async () => {
    if (get().loaded) return;
    await get().refresh();
    set({ loaded: true });
  },

  refresh: async () => {
    try {
      const [posRes, openRes, histRes] = await Promise.all([
        FuturesService.listPositions(),
        FuturesService.listOpenOrders(),
        FuturesService.listOrderHistory(),
      ]);
      set({
        positions: (posRes.data ?? []).map((p) => mapPos(p as Record<string, unknown>)),
        openOrders: (openRes.data ?? []).map((o) => mapOrder(o as Record<string, unknown>)),
        orderHistory: (histRes.rows ?? []).map((o) => mapOrder(o as Record<string, unknown>)),
      });
    } catch {
      /* 未登录时静默 */
    }
  },

  cancelOrder: async (orderNo) => {
    await FuturesService.cancelOrder(orderNo);
    await get().refresh();
  },

  clearForLogout: () => {
    set({ positions: [], openOrders: [], orderHistory: [], loaded: false });
  },
}));
