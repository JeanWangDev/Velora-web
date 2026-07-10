import { isAxiosError } from "axios";
import { getMarketWsUrl, resolveApiOrigin } from "@/config/api";

function restHint(): string {
  if (typeof window !== "undefined" && window.location.hostname.includes("aipassly.com")) {
    const origin = resolveApiOrigin();
    return `请确认后端 ${origin} 已启动（pm2 / nginx），且前端 API_PROXY_TARGET 指向该地址`;
  }
  return "请确认 Velora-api 已启动，且前端 API_PROXY_TARGET 配置正确";
}

function wsHint(): string {
  if (typeof window !== "undefined" && window.location.hostname.includes("aipassly.com")) {
    return `请确认 ${getMarketWsUrl()} 可连接`;
  }
  return `请确认 WebSocket 已启动（当前 ${getMarketWsUrl()}）`;
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
