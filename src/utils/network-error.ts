import { isAxiosError } from "axios";
import { getMarketWsUrl, resolveApiOrigin } from "@/config/api";

function restHint(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const apiOrigin = resolveApiOrigin();
    if (host === "localhost" || host === "127.0.0.1") {
      return `请确认 Velora-api 已启动（默认 http://localhost:4000），且 API_PROXY_TARGET 指向该地址`;
    }
    return `请确认 ${apiOrigin} 可访问（Velora-api），且后端 CLIENT_ORIGINS 已包含 https://${host}`;
  }
  return "请确认 Velora-api 已启动，且 API_PROXY_TARGET 配置正确";
}

function wsHint(): string {
  return `请确认 Velora-api WebSocket 可连接（当前 ${getMarketWsUrl()}）`;
}

/**
 * 将 axios / 网络层错误转为用户可读文案。
 */
export function resolveNetworkErrorMessage(
  error: unknown,
  context: "rest" | "ws" = "rest",
): string {
  const hint = context === "ws" ? wsHint() : restHint();

  if (isAxiosError(error)) {
    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      return `无法连接后端服务。${hint}`;
    }
    if (!error.response) {
      return `请求失败。${hint}`;
    }
  }

  if (error instanceof Error) {
    if (/network error/i.test(error.message) || /ECONNREFUSED/i.test(error.message)) {
      return `无法连接后端服务。${hint}`;
    }
    return error.message;
  }

  return String(error);
}
