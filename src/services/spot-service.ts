import { apiClient } from "@/services/api-client";
import type { OrderSide, OrderType, TimeInForce } from "@/types/exchange";

const BASE = "/api/v1/spot";

export interface ServerSpotSymbol {
  symbol: string;
  base: string;
  quote: string;
  displayName: string;
  pricePrecision: number;
  qtyPrecision: number;
  minQty: number;
  makerFee: number;
  takerFee: number;
  status: "trading" | "halt";
}

export interface ServerSpotOrder {
  orderNo: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce?: TimeInForce;
  price: number | null;
  quantity: number;
  filledQuantity: number;
  avgPrice: number;
  quoteSpent: number;
  fee: number;
  feeCurrency: string;
  status: "open" | "partial" | "filled" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface ServerSpotTrade {
  tradeNo: string;
  orderNo: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  fee: number;
  feeCurrency: string;
  role: "maker" | "taker";
  ts: number;
}

export interface PlaceSpotOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number | null;
  quantity: number;
  timeInForce?: TimeInForce;
}

export class SpotService {
  static listSymbols() {
    return apiClient.sendRequest<{ data: ServerSpotSymbol[] }>({
      url: `${BASE}/symbols`,
      method: "GET",
      skipAuth: true,
    });
  }

  static getOrderBook(symbol: string, limit = 50) {
    return apiClient.sendRequest<{
      symbol: string;
      bids: { price: number; quantity: number; source: string }[];
      asks: { price: number; quantity: number; source: string }[];
      lastPrice: number;
      ts: number;
    }>({
      url: `${BASE}/orderbook`,
      method: "GET",
      params: { symbol, limit },
      skipAuth: true,
    });
  }

  static placeOrder(input: PlaceSpotOrderInput) {
    return apiClient.sendRequest<{ order: ServerSpotOrder }>({
      url: `${BASE}/order`,
      method: "POST",
      data: input,
      showErrorToast: false,
    });
  }

  static cancelOrder(orderNo: string) {
    return apiClient.sendRequest<{ order: ServerSpotOrder }>({
      url: `${BASE}/order/cancel`,
      method: "POST",
      data: { orderNo },
    });
  }

  static amendOrder(input: {
    orderNo: string;
    price?: number | null;
    quantity?: number;
  }) {
    return apiClient.sendRequest<{ order: ServerSpotOrder }>({
      url: `${BASE}/order/amend`,
      method: "POST",
      data: input,
      showErrorToast: false,
    });
  }

  static openOrders(symbol?: string) {
    return apiClient.sendRequest<{ data: ServerSpotOrder[] }>({
      url: `${BASE}/orders/open`,
      method: "GET",
      params: symbol ? { symbol } : undefined,
      showErrorToast: false,
    });
  }

  static historyOrders(params?: { symbol?: string; page?: number; pageSize?: number }) {
    return apiClient.sendRequest<{
      data: ServerSpotOrder[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/orders/history`,
      method: "GET",
      params,
      showErrorToast: false,
    });
  }

  static trades(params?: { symbol?: string; page?: number; pageSize?: number }) {
    return apiClient.sendRequest<{
      data: ServerSpotTrade[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/trades`,
      method: "GET",
      params,
      showErrorToast: false,
    });
  }

  static placeAlgoOrder(input: {
    symbol: string;
    side: OrderSide;
    algoType: "stop_loss" | "take_profit" | "trailing_stop";
    triggerPrice: number;
    orderPrice: number | null;
    quantity: number;
    callbackRate?: number;
  }) {
    return apiClient.sendRequest<{ algoNo: string; status: string }>({
      url: `${BASE}/algo-order`,
      method: "POST",
      data: input,
      showErrorToast: false,
    });
  }

  static placeOco(input: {
    symbol: string;
    side: OrderSide;
    quantity: number;
    takeProfitTrigger: number;
    stopLossTrigger: number;
    takeProfitOrderPrice?: number | null;
    stopLossOrderPrice?: number | null;
  }) {
    return apiClient.sendRequest<{
      groupNo: string;
      takeProfitAlgoNo: string;
      stopLossAlgoNo: string;
    }>({
      url: `${BASE}/oco`,
      method: "POST",
      data: input,
      showErrorToast: false,
    });
  }

  static listAlgoOrders(symbol?: string) {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/algo-orders`,
      method: "GET",
      params: symbol ? { symbol } : undefined,
      showErrorToast: false,
    });
  }

  static cancelAlgoOrder(algoNo: string) {
    return apiClient.sendRequest({
      url: `${BASE}/algo-order/cancel`,
      method: "POST",
      data: { algoNo },
      showErrorToast: false,
    });
  }
}
