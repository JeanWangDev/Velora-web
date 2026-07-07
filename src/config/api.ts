/**
 * API / WebSocket 地址（按 NEXT_PUBLIC_APP_ENV 切换）
 */
import { appendWsToken } from "@/lib/ws-auth";
import {
  defaultApiOriginForEnv,
  getAppEnv,
  wsOriginFromHttpOrigin,
  type AppEnv,
} from "@/config/env";

export const PRODUCTION_API_ORIGIN = "https://api.velora.com";
export const TEST_API_ORIGIN = "https://velora-api-test.aipassly.com";
/** @deprecated use TEST_API_ORIGIN */
export const PRE_API_ORIGIN = TEST_API_ORIGIN;
export const LOCAL_API_ORIGIN = "http://localhost:4000";

const MARKET_WS_PATH = "/ws/market";
const EVENTS_WS_PATH = "/ws/events";

function trimOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** 测试前端域名 */
function isTestFrontendHost(hostname: string): boolean {
  return (
    hostname === "velora-test.aipassly.com" ||
    hostname === "app-test.velora.com" ||
    hostname === "test.velora.com" ||
    hostname.startsWith("app-test.") ||
    (hostname.endsWith(".workers.dev") && hostname.includes("velora-web-test"))
  );
}

/** 生产前端域名（非 api 子域） */
function isProductionFrontendHost(hostname: string): boolean {
  if (!hostname.endsWith(".velora.com") && hostname !== "velora.com") {
    return false;
  }
  if (hostname.startsWith("api.") || hostname.startsWith("api-test.")) {
    return false;
  }
  return !isTestFrontendHost(hostname);
}

function envApiOrigin(): string | undefined {
  const value =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_PROXY_TARGET;
  return value ? trimOrigin(value) : undefined;
}

function resolveAppEnvFromHostname(hostname: string): AppEnv | null {
  if (isLocalHost(hostname)) return null;
  if (isTestFrontendHost(hostname)) return "test";
  if (isProductionFrontendHost(hostname)) return "production";
  return null;
}

/** REST / SSR 用的后端 origin */
export function resolveApiOrigin(): string {
  const fromEnv = envApiOrigin();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const fromHost = resolveAppEnvFromHostname(window.location.hostname);
    if (fromHost) return defaultApiOriginForEnv(fromHost);
    if (isLocalHost(window.location.hostname)) {
      return defaultApiOriginForEnv("development");
    }
  }

  return defaultApiOriginForEnv(getAppEnv());
}

/** Axios baseURL：本地 dev 走同源 /api/v1 代理，线上直连 API 子域 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return trimOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
  }

  if (typeof window !== "undefined") {
    if (isLocalHost(window.location.hostname)) return "";
    return resolveApiOrigin();
  }

  return resolveApiOrigin();
}

/** Web Worker 内必须绝对 URL */
export function getWorkerApiBaseUrl(): string {
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
      ? trimOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
      : window.location.origin;
  }
  return resolveApiOrigin();
}

export function apiV1Path(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/api/v1${normalized}`;
}

export function getMarketWsUrl(): string {
  if (process.env.NEXT_PUBLIC_API_WS_URL) {
    return process.env.NEXT_PUBLIC_API_WS_URL;
  }
  return wsOriginFromHttpOrigin(resolveApiOrigin(), MARKET_WS_PATH);
}

function buildEventsWsBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_EVENTS_WS_URL) {
    return process.env.NEXT_PUBLIC_EVENTS_WS_URL;
  }
  return wsOriginFromHttpOrigin(resolveApiOrigin(), EVENTS_WS_PATH);
}

export function getEventsWsUrl(): string {
  const base = buildEventsWsBaseUrl();
  if (typeof window === "undefined") return base;
  return appendWsToken(base);
}

export const DEFAULT_EXCHANGE = "binance";
