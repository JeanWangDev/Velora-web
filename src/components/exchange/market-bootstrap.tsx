"use client";

import { useEffect } from "react";
import { getMarketStreamClient } from "@/services/market-stream-client";
import { useSymbolRegistry } from "@/stores/use-symbol-registry";

/**
 * 全局行情引导：预加载交易对列表 + 批量 24h 行情 + 初始化 WS 客户端。
 * 盘口/成交订阅由交易页按当前 symbol 单独挂载。
 */
export function MarketBootstrap() {
  useEffect(() => {
    getMarketStreamClient();
    void useSymbolRegistry.getState().hydrate();
  }, []);

  return null;
}
