import { apiClient } from "@/services/api-client";
import type { ServerBalance } from "@/services/account-service";

const BASE = "/api/v1/admin/finance";

export interface AdminFinanceOp {
  opNo: string;
  operatorId: number;
  operatorEmail: string;
  targetUserId: number;
  targetEmail: string;
  currency: string;
  amount: number;
  type: "credit" | "debit";
  remark: string;
  ts: number;
}

export interface AdminUserBalances {
  userId: number;
  email: string;
  nickname: string;
  balances: ServerBalance[];
}

export class AdminFinanceService {
  static credit(body: {
    userId: number;
    currency: string;
    amount: number;
    remark?: string;
  }) {
    return apiClient.sendRequest<{
      balances: ServerBalance[];
      op: AdminFinanceOp;
    }>({
      url: `${BASE}/credit`,
      method: "POST",
      data: body,
    });
  }

  static debit(body: {
    userId: number;
    currency: string;
    amount: number;
    remark?: string;
  }) {
    return apiClient.sendRequest<{
      balances: ServerBalance[];
      op: AdminFinanceOp;
    }>({
      url: `${BASE}/debit`,
      method: "POST",
      data: body,
    });
  }

  static listOps(params?: {
    page?: number;
    pageSize?: number;
    targetUserId?: number;
    currency?: string;
    type?: "credit" | "debit";
  }) {
    return apiClient.sendRequest<{
      data: AdminFinanceOp[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/ops`,
      method: "GET",
      params,
    });
  }

  static getUserBalances(userId: number) {
    return apiClient.sendRequest<AdminUserBalances>({
      url: `${BASE}/user-balances`,
      method: "GET",
      params: { userId },
    });
  }
}
