import { apiClient } from "@/services/api-client";

const BASE = "/api/v1/exchanges";

export class ExchangeService {
  static list() {
    return apiClient.sendRequest<{
      connections: Array<{
        id: number;
        exchange: string;
        label: string;
        permissions: string;
        connected: boolean;
      }>;
    }>({
      url: BASE,
      method: "GET",
    });
  }

  static connectOkx(input: {
    apiKey: string;
    secretKey: string;
    passphrase: string;
    label?: string;
  }) {
    return apiClient.sendRequest<{
      connection: { id: number; exchange: string; label: string };
    }>({
      url: `${BASE}/okx/connect`,
      method: "POST",
      data: input,
    });
  }

  static disconnectOkx() {
    return apiClient.sendRequest<null>({
      url: `${BASE}/okx/disconnect`,
      method: "POST",
      data: {},
    });
  }
}
