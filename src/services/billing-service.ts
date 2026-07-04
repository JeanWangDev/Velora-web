import { apiClient } from "@/services/api-client";
import type { MembershipPlan, PaymentOrder, UserSubscription } from "@/types/billing";

const BASE = "/api/v1/billing";

export class BillingService {
  static listPlans() {
    return apiClient.sendRequest<{ plans: MembershipPlan[] }>({
      url: `${BASE}/plans`,
      method: "GET",
      skipAuth: true,
    });
  }

  static getSubscription() {
    return apiClient.sendRequest<{ subscription: UserSubscription | null }>({
      url: `${BASE}/subscription`,
      method: "GET",
    });
  }

  static createOrder(planKey: string) {
    return apiClient.sendRequest<{ order: PaymentOrder }>({
      url: `${BASE}/orders`,
      method: "POST",
      data: { planKey },
    });
  }

  static getOrder(orderNo: string) {
    return apiClient.sendRequest<{ order: PaymentOrder }>({
      url: `${BASE}/orders/${encodeURIComponent(orderNo)}`,
      method: "GET",
    });
  }

  static listOrders() {
    return apiClient.sendRequest<{ orders: PaymentOrder[] }>({
      url: `${BASE}/orders`,
      method: "GET",
    });
  }

  static cancelOrder(orderNo: string) {
    return apiClient.sendRequest<{ order: PaymentOrder }>({
      url: `${BASE}/orders/${encodeURIComponent(orderNo)}/cancel`,
      method: "POST",
    });
  }
}
