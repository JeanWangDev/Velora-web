import { apiClient } from "@/services/api-client";

const BASE = "/api/v1/copy";

export class CopyService {
  static list() {
    return apiClient.sendRequest<{
      subscriptions: Array<{
        id: number;
        strategyKey: string;
        exchangeConnectionId: number;
        tradeMode: string;
        orderSizeUsdt: string;
        lastSignal: string | null;
      }>;
    }>({
      url: `${BASE}/subscriptions`,
      method: "GET",
    });
  }

  static subscribe(input: {
    strategyKey: string;
    exchangeConnectionId: number;
    orderSizeUsdt?: number;
    tradeMode?: "live" | "paper";
  }) {
    return apiClient.sendRequest<{ subscription: unknown }>({
      url: `${BASE}/subscribe`,
      method: "POST",
      data: input,
    });
  }

  static unsubscribe(strategyKey: string) {
    return apiClient.sendRequest<null>({
      url: `${BASE}/unsubscribe`,
      method: "POST",
      data: { strategyKey },
    });
  }
}
