import { apiClient } from "./api-client";

export type AnnouncementCategory = "listing" | "maintenance" | "risk" | "system" | "all";

export interface Announcement {
  id: number;
  category: AnnouncementCategory;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  contentZh: string;
  contentEn: string;
  pinned: number;
  publishedAt: number;
}

const BASE = "/api/v1/announcements";

export class AnnouncementService {
  static list(category?: AnnouncementCategory, page = 1, pageSize = 50) {
    return apiClient.sendRequest<{
      rows: Announcement[];
      total: number;
    }>({
      url: BASE,
      method: "GET",
      params: { category: category === "all" ? undefined : category, page, pageSize },
      skipAuth: true,
    });
  }

  static getById(id: number) {
    return apiClient.sendRequest<Announcement>({
      url: `${BASE}/${id}`,
      method: "GET",
      skipAuth: true,
    });
  }
}
