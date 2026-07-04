import { apiClient } from "./api-client";
import type { ChartTemplate } from "@/types/chart-template";
import type {
  ChartTemplateRankingsResponse,
  TemplateRankingPeriod,
} from "@/types/chart-template-ranking";

const BASE = "/api/v1/chart-templates";

export class ChartTemplateService {
  static listPublic(options?: { symbol?: string }) {
    return apiClient.sendRequest<{ data: ChartTemplate[] }>({
      url: `${BASE}/public`,
      method: "GET",
      params: options?.symbol ? { symbol: options.symbol } : undefined,
      skipAuth: true,
    });
  }

  static rankings(period: TemplateRankingPeriod = "week", limit = 5) {
    return apiClient.sendRequest<ChartTemplateRankingsResponse>({
      url: `${BASE}/rankings`,
      method: "GET",
      params: { period, limit },
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static track(id: string, event: "apply" | "copy") {
    return apiClient.sendRequest<null>({
      url: `${BASE}/track`,
      method: "POST",
      data: { id, event },
      showErrorToast: false,
    });
  }

  static listMine(options?: { symbol?: string }) {
    return apiClient.sendRequest<{ data: ChartTemplate[] }>({
      url: `${BASE}/mine`,
      method: "GET",
      params: options?.symbol ? { symbol: options.symbol } : undefined,
    });
  }

  /** @deprecated use listMine or listPublic */
  static list() {
    return ChartTemplateService.listMine();
  }

  static getStarter() {
    return apiClient.sendRequest<ChartTemplate | null>({
      url: `${BASE}/starter`,
      method: "GET",
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static getDefault(symbol: string) {
    return apiClient.sendRequest<ChartTemplate | null>({
      url: `${BASE}/default`,
      method: "GET",
      params: { symbol },
      showErrorToast: false,
    });
  }

  static detail(id: string) {
    return apiClient.sendRequest<ChartTemplate>({
      url: `${BASE}/detail`,
      method: "GET",
      params: { id },
      showErrorToast: false,
    });
  }

  static create(body: {
    name: string;
    symbolId?: number | null;
    symbol?: string;
    indicatorIds: string[];
    visibility?: "private" | "public";
    isDefault?: boolean;
  }) {
    return apiClient.sendRequest<ChartTemplate>({
      url: BASE,
      method: "POST",
      data: body,
    });
  }

  static update(
    id: string,
    body: Partial<{
      name: string;
      symbolId: number | null;
      symbol: string;
      indicatorIds: string[];
      visibility: "private" | "public";
    }>,
  ) {
    return apiClient.sendRequest<ChartTemplate>({
      url: `${BASE}/update`,
      method: "POST",
      data: { id, ...body },
    });
  }

  static setDefault(id: string) {
    return apiClient.sendRequest<ChartTemplate>({
      url: `${BASE}/set-default`,
      method: "POST",
      data: { id },
    });
  }

  static remove(id: string) {
    return apiClient.sendRequest<null>({
      url: `${BASE}/remove`,
      method: "POST",
      data: { id },
    });
  }
}
