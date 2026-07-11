import { apiClient } from "./api-client";

const BASE = "/api/v1/futures";

export class FuturesService {
  static placeOrder(input: {
    symbol: string;
    side: "buy" | "sell";
    posSide: "long" | "short";
    type: "limit" | "market";
    price: number | null;
    quantity: number;
    leverage: number;
    marginMode: "cross" | "isolated";
    reduceOnly?: boolean;
  }) {
    return apiClient.sendRequest<{
      orderNo: string;
      status: string;
      avgPrice: number;
    }>({
      url: `${BASE}/order`,
      method: "POST",
      data: input,
      showErrorToast: false,
    });
  }

  static listPositions() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/positions`,
      method: "GET",
      showErrorToast: false,
    });
  }

  static listSymbols() {
    return apiClient.sendRequest<{
      data: {
        symbol: string;
        base: string;
        quote: string;
        pricePrecision: number;
        qtyPrecision: number;
        minQty: number;
        maxLeverage: number;
        makerFee: number;
        takerFee: number;
        status: "trading" | "halt";
      }[];
    }>({
      url: `${BASE}/symbols`,
      method: "GET",
      skipAuth: true,
    });
  }

  static listOpenOrders(symbol?: string) {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/orders/open`,
      method: "GET",
      params: symbol ? { symbol } : undefined,
      showErrorToast: false,
    });
  }

  static listOrderHistory(page = 1, pageSize = 50, symbol?: string) {
    return apiClient.sendRequest<{ rows: unknown[]; total: number }>({
      url: `${BASE}/orders/history`,
      method: "GET",
      params: { page, pageSize, symbol },
      showErrorToast: false,
    });
  }

  static cancelOrder(orderNo: string) {
    return apiClient.sendRequest({
      url: `${BASE}/order/cancel`,
      method: "POST",
      data: { orderNo },
      showErrorToast: false,
    });
  }

  static listMarkPrices() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/mark-prices`,
      method: "GET",
      skipAuth: true,
      showErrorToast: false,
    });
  }
}
