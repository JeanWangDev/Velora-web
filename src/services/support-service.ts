import { apiClient } from "./api-client";

const BASE = "/api/v1/support";

export interface SupportTicket {
  ticketNo: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  adminReply?: string | null;
  createdAt: number;
}

export class SupportService {
  static list() {
    return apiClient.sendRequest<{ data: SupportTicket[] }>({
      url: `${BASE}/tickets`,
      method: "GET",
    });
  }

  static create(input: { category?: string; subject: string; body: string }) {
    return apiClient.sendRequest<{ ticketNo: string; status: string }>({
      url: `${BASE}/tickets`,
      method: "POST",
      data: input,
    });
  }
}
