import { apiClient } from "@/services/api-client";
import type { EventDetail, EventListItem, EventListResponse } from "@/app/news/_types/event";

const BASE = "/api/v1/events";

export class EventsService {
  static list(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    source?: string;
    symbol?: string;
  }) {
    return apiClient.sendRequest<EventListResponse>({
      url: `${BASE}/list`,
      method: "GET",
      params,
      skipAuth: true,
      showErrorToast: true,
    });
  }

  static recent(limit = 10) {
    return apiClient.sendRequest<{ data: EventListItem[] }>({
      url: `${BASE}/recent`,
      method: "GET",
      params: { limit },
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static chart(params: { symbol: string; from: number; to: number; limit?: number }) {
    return apiClient.sendRequest<{ data: EventListItem[] }>({
      url: `${BASE}/chart`,
      method: "GET",
      params,
      skipAuth: true,
      showErrorToast: false,
    });
  }

  static getById(id: string) {
    return apiClient.sendRequest<EventDetail>({
      url: `${BASE}/${encodeURIComponent(id)}`,
      method: "GET",
      skipAuth: true,
      showErrorToast: true,
    });
  }
}
