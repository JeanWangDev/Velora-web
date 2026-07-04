/** Dashboard 专属 API：Overview 聚合数据 */
import type { DashboardOverviewResponse } from "@/app/dashboard/_types/dashboard";
import { apiClient } from "@/services/api-client";

export class DashboardOverviewService { 
    public static dashboardOverview() {
    return apiClient.sendRequest<DashboardOverviewResponse>({
        url: "/api/v1/dashboard/overview",
        method: "GET",
    })
  }
}
