import { apiClient } from "./api-client";

const BASE = "/api/v1/api-keys";

export interface ApiKeyRow {
  id: number;
  label: string;
  apiKey: string;
  permissions: string;
  ipWhitelist?: string;
  symbolWhitelist?: string;
  status: number;
  lastUsedAt?: number | null;
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

  static create(input: {
    label?: string;
    permissions?: string;
    ipWhitelist?: string;
    symbolWhitelist?: string;
  }) {
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

  static update(input: {
    apiKey: string;
    label?: string;
    permissions?: string;
    ipWhitelist?: string;
    symbolWhitelist?: string;
  }) {
    return apiClient.sendRequest<{ ok: boolean }>({
      url: `${BASE}/update`,
      method: "POST",
      data: input,
    });
  }

  static logs(apiKey: string) {
    return apiClient.sendRequest<{
      data: {
        method: string;
        path: string;
        statusCode: number;
        ip: string;
        ts: number;
      }[];
    }>({
      url: `${BASE}/logs`,
      method: "GET",
      params: { apiKey },
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
