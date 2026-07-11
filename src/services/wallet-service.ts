import { apiClient } from "./api-client";

const BASE = "/api/v1/wallet";

export class WalletService {
  static getDepositAddress(currency: string, chain: string) {
    return apiClient.sendRequest<{ address: string; memo: string }>({
      url: `${BASE}/deposit-address`,
      method: "GET",
      params: { currency, chain },
    });
  }

  static withdraw(input: {
    currency: string;
    chain: string;
    amount: number;
    address: string;
    memo?: string;
  }) {
    return apiClient.sendRequest<{ withdrawNo: string; status: string }>({
      url: `${BASE}/withdraw`,
      method: "POST",
      data: input,
    });
  }

  static transfer(input: {
    currency: string;
    amount: number;
    fromAccount: "funding" | "trading" | "futures";
    toAccount: "funding" | "trading" | "futures";
  }) {
    return apiClient.sendRequest<{ transferNo: string; status: string }>({
      url: `${BASE}/transfer`,
      method: "POST",
      data: input,
    });
  }

  static listDeposits(page = 1, pageSize = 20) {
    return apiClient.sendRequest({
      url: `${BASE}/deposits`,
      method: "GET",
      params: { page, pageSize },
    });
  }

  static listWithdrawals(page = 1, pageSize = 20) {
    return apiClient.sendRequest({
      url: `${BASE}/withdrawals`,
      method: "GET",
      params: { page, pageSize },
    });
  }

  static listTransfers(page = 1, pageSize = 20) {
    return apiClient.sendRequest({
      url: `${BASE}/transfers`,
      method: "GET",
      params: { page, pageSize },
    });
  }

  static getChains() {
    return apiClient.sendRequest<{ chains: Record<string, string[]> }>({
      url: `${BASE}/chains`,
      method: "GET",
      skipAuth: true,
    });
  }
}
