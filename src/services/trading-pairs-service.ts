import { apiClient } from "./api-client";
import type { TradingPair } from "@/types/trading-pair";

const BASE = "/api/v1/market";

export class TradingPairsService {
  static list() {
    return apiClient.sendRequest<TradingPair[]>({
      url: `${BASE}/trading-pairs`,
      method: "GET",
      skipAuth: true,
      showErrorToast: false,
    });
  }
}
