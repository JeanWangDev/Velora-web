import { apiClient } from "./api-client";

const BASE = "/api/v1/notifications";

export interface UserNotification {
  id: number;
  type: "trade" | "deposit" | "withdraw" | "system" | "risk";
  title: string;
  body: string;
  refId: string;
  read: number;
  ts: number;
}

export class NotificationService {
  static list(page = 1, pageSize = 30) {
    return apiClient.sendRequest<{
      rows: UserNotification[];
      total: number;
      unread: number;
      page: number;
      pageSize: number;
    }>({
      url: BASE,
      method: "GET",
      params: { page, pageSize },
      showErrorToast: false,
    });
  }

  static markRead(ids: number[]) {
    return apiClient.sendRequest({
      url: `${BASE}/read`,
      method: "POST",
      data: { ids },
      showErrorToast: false,
    });
  }
}
