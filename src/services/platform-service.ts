import { apiClient } from "@/services/api-client";

const BASE = "/api/v1/platform";

export class PlatformService {
  static listEarnProducts() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/earn/products`,
      method: "GET",
      skipAuth: true,
    });
  }

  static listEarnPositions() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/earn/positions`,
      method: "GET",
    });
  }

  static subscribeEarn(productNo: string, amount: number) {
    return apiClient.sendRequest({
      url: `${BASE}/earn/subscribe`,
      method: "POST",
      data: { productNo, amount },
    });
  }

  static redeemEarn(positionId: number) {
    return apiClient.sendRequest({
      url: `${BASE}/earn/redeem`,
      method: "POST",
      data: { positionId },
    });
  }

  static getAccountTier() {
    return apiClient.sendRequest<{
      current: Record<string, unknown> | null;
      progress: Record<string, unknown>;
      nextTier: string | null;
    }>({ url: `${BASE}/account/tier`, method: "GET" });
  }

  static getUnifiedEquity() {
    return apiClient.sendRequest<{
      mode: string;
      equityUsd: number;
      unrealizedPnl: number;
    }>({ url: `${BASE}/unified/equity`, method: "GET" });
  }

  static setUnifiedMode(mode: "classic" | "unified") {
    return apiClient.sendRequest({
      url: `${BASE}/unified/mode`,
      method: "POST",
      data: { mode },
    });
  }

  static listOptions() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/options/instruments`,
      method: "GET",
      skipAuth: true,
    });
  }

  static placeOptionOrder(symbol: string, side: "buy" | "sell", quantity: number) {
    return apiClient.sendRequest({
      url: `${BASE}/options/order`,
      method: "POST",
      data: { symbol, side, quantity },
    });
  }

  static createQuickBuyOrder(fiatAmount: number, crypto = "USDT") {
    return apiClient.sendRequest<{ orderNo: string; cryptoAmount: number; status: string }>({
      url: `${BASE}/quick-buy/order`,
      method: "POST",
      data: { fiatAmount, crypto },
    });
  }

  static confirmQuickBuy(orderNo: string) {
    return apiClient.sendRequest({
      url: `${BASE}/quick-buy/confirm`,
      method: "POST",
      data: { orderNo },
    });
  }

  static getMarginSummary() {
    return apiClient.sendRequest<{ loans: unknown[]; totalLiability: number }>({
      url: `${BASE}/margin/summary`,
      method: "GET",
    });
  }

  static borrowMargin(currency: string, amount: number) {
    return apiClient.sendRequest({
      url: `${BASE}/margin/borrow`,
      method: "POST",
      data: { currency, amount },
    });
  }

  static repayMargin(loanId: number) {
    return apiClient.sendRequest({
      url: `${BASE}/margin/repay`,
      method: "POST",
      data: { loanId },
    });
  }

  static getUnifiedMode() {
    return apiClient.sendRequest<{ mode: "classic" | "unified" }>({
      url: `${BASE}/unified/mode`,
      method: "GET",
    });
  }
}
