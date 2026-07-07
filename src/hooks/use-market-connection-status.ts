"use client";

import { useEffect, useState } from "react";
import {
  getWsConnectStatusChangeSubName,
  publicWebSocketEmitter,
} from "@/lib/public-ws-client";

export type MarketConnectionStatus = "stable" | "reconnecting" | "offline";

const MARKET_WS_NAME = "market";

/**
 * 交易页网络/行情连接状态：
 * - offline：浏览器离线（DevTools Offline 也会触发）
 * - reconnecting：在线但行情 WebSocket 未连接（重连中）
 * - stable：在线且 WebSocket 已连接，或尚未初始化行情 WS
 */
export function useMarketConnectionStatus(): MarketConnectionStatus {
  const [online, setOnline] = useState(true);
  const [wsConnected, setWsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOnline = () => setOnline(navigator.onLine);
    syncOnline();

    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    const onWsStatus = (payload: { isConnected?: boolean }) => {
      setWsConnected(Boolean(payload.isConnected));
    };

    publicWebSocketEmitter.on(
      getWsConnectStatusChangeSubName(MARKET_WS_NAME),
      onWsStatus,
    );

    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      publicWebSocketEmitter.off(
        getWsConnectStatusChangeSubName(MARKET_WS_NAME),
        onWsStatus,
      );
    };
  }, []);

  if (!online) return "offline";
  if (wsConnected === false) return "reconnecting";
  return "stable";
}
