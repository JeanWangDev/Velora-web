import { apiClient } from "@/services/api-client";

const BASE = "/api/v1/admin/platform";

export class AdminPlatformService {
  static listSettlementBatches() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/settlement/batches`,
      method: "GET",
    });
  }

  static runSettlement() {
    return apiClient.sendRequest<{ batchNo: string }>({
      url: `${BASE}/settlement/run`,
      method: "POST",
    });
  }

  static listInsuranceFund() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/insurance-fund`,
      method: "GET",
    });
  }

  static listAmlAlerts() {
    return apiClient.sendRequest<{ data: unknown[] }>({
      url: `${BASE}/aml/alerts`,
      method: "GET",
    });
  }

  static scanDeposits() {
    return apiClient.sendRequest<{ matched: number }>({
      url: `${BASE}/deposit/scan`,
      method: "POST",
    });
  }

  static reviewKyb(userId: number, approve: boolean, reason?: string) {
    return apiClient.sendRequest({
      url: `${BASE}/kyb/review`,
      method: "POST",
      data: { userId, approve, reason },
    });
  }
}
