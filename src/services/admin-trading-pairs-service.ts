import { apiClient } from "./api-client";
import type { TradingPair } from "@/types/trading-pair";

const BASE = "/api/v1/admin/trading-pairs";

export type AdminTradingPairInput = {
  baseAsset: string;
  symbol: string;
  exchange?: string;
  displayName?: string;
  sortOrder?: number;
  isDefault?: boolean;
  accessTier?: 0 | 1;
  status?: 0 | 1;
};

export class AdminTradingPairsService {
  static list() {
    return apiClient.sendRequest<{ data: TradingPair[] }>({
      url: BASE,
      method: "GET",
    });
  }

  static create(body: AdminTradingPairInput) {
    return apiClient.sendRequest<TradingPair>({
      url: BASE,
      method: "POST",
      data: body,
    });
  }

  static update(id: number, body: Partial<AdminTradingPairInput>) {
    return apiClient.sendRequest<TradingPair>({
      url: `${BASE}/update`,
      method: "POST",
      data: { id, ...body },
    });
  }

  static remove(id: number) {
    return apiClient.sendRequest<null>({
      url: `${BASE}/remove`,
      method: "POST",
      data: { id },
    });
  }
}
