import { apiClient } from "./api-client";

const BASE = "/api/v1/admin";

export class AdminWithdrawService {
  static listPending(page = 1, pageSize = 50) {
    return apiClient.sendRequest<{
      rows: {
        id: number;
        withdrawNo: string;
        userId: number;
        currency: string;
        chain: string;
        amount: number;
        fee: number;
        address: string;
        status: string;
        ts: number;
      }[];
      total: number;
    }>({
      url: `${BASE}/withdrawals/pending`,
      method: "GET",
      params: { page, pageSize },
    });
  }

  static approve(withdrawNo: string, txHash?: string) {
    return apiClient.sendRequest({
      url: `${BASE}/withdrawals/approve`,
      method: "POST",
      data: { withdrawNo, txHash },
    });
  }

  static reject(withdrawNo: string, reason?: string) {
    return apiClient.sendRequest({
      url: `${BASE}/withdrawals/reject`,
      method: "POST",
      data: { withdrawNo, reason },
    });
  }

  static confirmDeposit(input: {
    userId: number;
    currency: string;
    chain: string;
    amount: number;
    txHash: string;
  }) {
    return apiClient.sendRequest({
      url: `${BASE}/deposits/confirm`,
      method: "POST",
      data: input,
    });
  }
}
