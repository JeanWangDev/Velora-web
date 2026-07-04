/** Dashboard 页面数据拉取与 loading/error 状态 */
"use client";

import { create } from "zustand";
import { DashboardOverviewService } from "@/app/dashboard/_services/dashboard-overview-service";
import type { DashboardOverviewResponse } from "@/app/dashboard/_types/dashboard";
import { resolveNetworkErrorMessage } from "@/utils/network-error";

interface DashboardState {
  data: DashboardOverviewResponse | null;
  loading: boolean;
  error: string | null;
  fetchOverview: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  fetchOverview: async () => {
    // 防止 Strict Mode 或重复挂载导致并发请求
    if (get().loading) {
      return;
    }

    set({
      loading: true,
      error: null,
    });

    try {
      const data = await DashboardOverviewService.dashboardOverview();
      set({
        data,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: resolveNetworkErrorMessage(error, "rest"),
      });
    }
  },
}));
