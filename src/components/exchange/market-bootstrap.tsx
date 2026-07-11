"use client";

import { useEffect } from "react";
import { getMarketStreamClient } from "@/services/market-stream-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSymbolRegistry } from "@/stores/use-symbol-registry";

/**
 * 全局行情引导：仅预加载交易对列表 + 初始化 WS 客户端。
 * 盘口/成交订阅由交易页按当前 symbol 单独挂载，避免未登录时轰炸接口。
 */
export function MarketBootstrap() {
  const authHydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    getMarketStreamClient();
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    void useSymbolRegistry.getState().hydrate();
  }, [authHydrated]);

  return null;
}
