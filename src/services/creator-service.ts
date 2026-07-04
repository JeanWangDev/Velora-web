import { apiClient } from "@/services/api-client";

const BASE = "/api/v1/creator";

export class CreatorService {
  static getBalance() {
    return apiClient.sendRequest<{
      availableUsdt: string;
      pendingUsdt: string;
      lifetimeEarnedUsdt: string;
      ledger: Array<{
        id: number;
        type: string;
        amountUsdt: string;
        note: string;
        createTime: number;
      }>;
    }>({
      url: `${BASE}/balance`,
      method: "GET",
    });
  }

  static withdraw(input: { amountUsdt: number; address: string; chain?: string }) {
    return apiClient.sendRequest<{
      withdrawalId: number;
      status: string;
      amountUsdt: string;
    }>({
      url: `${BASE}/withdraw`,
      method: "POST",
      data: input,
    });
  }
}
