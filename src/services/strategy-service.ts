import { apiClient } from "@/services/api-client";
import type { CreateStrategyInput, StrategyProduct, StrategySignalPayload } from "@/types/strategy";

const BASE = "/api/v1/strategies";

export class StrategyService {
  static list() {
    return apiClient.sendRequest<{ strategies: StrategyProduct[] }>({
      url: BASE,
      method: "GET",
    });
  }

  static mine(scope: "published" | "following" = "following") {
    return apiClient.sendRequest<{ strategies: StrategyProduct[]; scope: string }>({
      url: `${BASE}/mine`,
      method: "GET",
      params: { scope },
    });
  }

  static create(input: CreateStrategyInput) {
    return apiClient.sendRequest<{ strategy: StrategyProduct }>({
      url: BASE,
      method: "POST",
      data: input,
    });
  }

  static update(strategyKey: string, input: Partial<CreateStrategyInput>) {
    return apiClient.sendRequest<{ strategy: StrategyProduct }>({
      url: `${BASE}/update`,
      method: "POST",
      data: { strategyKey, ...input },
    });
  }

  static get(strategyKey: string) {
    return apiClient.sendRequest<{ strategy: StrategyProduct }>({
      url: `${BASE}/${encodeURIComponent(strategyKey)}`,
      method: "GET",
    });
  }

  static getSignal(strategyKey: string) {
    return apiClient.sendRequest<StrategySignalPayload>({
      url: `${BASE}/${encodeURIComponent(strategyKey)}/signal`,
      method: "GET",
    });
  }
}
