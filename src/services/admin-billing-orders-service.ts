import { apiClient } from "@/services/api-client";
import type { PaymentStatus } from "@/types/billing";

export type AdminBillingOrder = {
  orderNo: string;
  userId: number;
  userEmail: string;
  planKey: string;
  amountUsdt: string;
  depositAddress: string;
  status: string;
  paymentStatus: PaymentStatus;
  txHash: string | null;
  expireAt: number;
  paidAt: number | null;
  createdAt: number;
};

export class AdminBillingOrdersService {
  static list(params: { page?: number; pageSize?: number; status?: string; query?: string }) {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    if (params.status) search.set("status", params.status);
    if (params.query) search.set("query", params.query);
    const qs = search.toString();

    return apiClient.sendRequest<{
      data: AdminBillingOrder[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `/api/v1/admin/billing/orders${qs ? `?${qs}` : ""}`,
      method: "GET",
    });
  }
}
