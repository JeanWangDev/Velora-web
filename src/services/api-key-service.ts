import { apiClient } from "./api-client";

const BASE = "/api/v1/api-keys";

export interface ApiKeyRow {
  id: number;
  label: string;
  apiKey: string;
  permissions: string;
  status: number;
  createdAt: number;
}

export class ApiKeyService {
  static list() {
    return apiClient.sendRequest<{ data: ApiKeyRow[] }>({
      url: BASE,
      method: "GET",
      showErrorToast: false,
    });
  }

  static create(input: { label?: string; permissions?: string }) {
    return apiClient.sendRequest<{
      apiKey: string;
      apiSecret: string;
      label: string;
      permissions: string;
    }>({
      url: BASE,
      method: "POST",
      data: input,
    });
  }

  static revoke(apiKey: string) {
    return apiClient.sendRequest({
      url: `${BASE}/revoke`,
      method: "POST",
      data: { apiKey },
    });
  }
}
