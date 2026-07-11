import { apiClient } from "@/services/api-client";
import type { LedgerType } from "@/types/exchange";

const BASE = "/api/v1/account";

export interface ServerBalance {
  currency: string;
  accountType?: AccountType;
  available: number;
  frozen: number;
}

export type AccountType = "funding" | "trading" | "futures";

export interface ServerLedgerEntry {
  id: number;
  currency: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  refId: string;
  ts: number;
}

export class AccountService {
  static getBalances(accountType?: AccountType) {
    return apiClient.sendRequest<{ balances: ServerBalance[] }>({
      url: `${BASE}/balances`,
      method: "GET",
      params: accountType ? { accountType } : undefined,
      showErrorToast: false,
    });
  }

  static getLedger(params?: { currency?: string; page?: number; pageSize?: number }) {
    return apiClient.sendRequest<{
      data: ServerLedgerEntry[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/ledger`,
      method: "GET",
      params,
      showErrorToast: false,
    });
  }
}
