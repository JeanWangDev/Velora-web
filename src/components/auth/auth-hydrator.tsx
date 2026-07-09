"use client";

import { useEffect } from "react";
import { setUnauthorizedHandler } from "@/services/api-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useKycStore } from "@/stores/use-kyc-store";
import { useTradingStore } from "@/stores/use-trading-store";

export function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const logout = useAuthStore((state) => state.logout);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const hydrateKyc = useKycStore((state) => state.hydrateFromServer);
  const resetKyc = useKycStore((state) => state.reset);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      resetKyc();
      useTradingStore.getState().clearForLogout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout, resetKyc]);

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [hydrate, hydrated]);

  // 登录态确定后：有用户则从后端同步 KYC，无用户则清空本地 KYC
  useEffect(() => {
    if (!hydrated) return;
    if (userId) {
      void hydrateKyc();
    } else {
      resetKyc();
    }
  }, [hydrated, userId, hydrateKyc, resetKyc]);

  return null;
}
