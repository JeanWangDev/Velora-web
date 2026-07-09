import { apiClient } from "@/services/api-client";
import type { OrderSide, OrderType } from "@/types/exchange";

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
}

export class SpotService {
  static listSymbols() {
    return apiClient.sendRequest<{ data: ServerSpotSymbol[] }>({
      url: `${BASE}/symbols`,
      method: "GET",
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
}
