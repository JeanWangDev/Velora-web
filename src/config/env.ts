/**
 * 前端运行环境 → 后端 API 地址
 *
 * NEXT_PUBLIC_APP_ENV:
 *   development → localhost:4000（本地 yarn dev）
 *   test        → velora-api-test.aipassly.com（测试 API）
 *                   前端 velora-test.aipassly.com 访问时自动匹配
 *   production  → velora-api.aipassly.com（正式 API，待上线）
 *
 * 显式设置 API_PROXY_TARGET 时 SSR / 构建 rewrite 优先使用。
 */
export type AppEnv = "development" | "test" | "production";

export const API_ORIGIN_BY_ENV: Record<AppEnv, string> = {
  development: "http://localhost:4000",
  test: "https://velora-api-test.aipassly.com",
  production: "https://velora-api.aipassly.com",
};

const VALID_ENVS: AppEnv[] = ["development", "test", "production"];

export function getAppEnv(): AppEnv {
  const raw = process.env.NEXT_PUBLIC_APP_ENV?.trim();
  if (raw && VALID_ENVS.includes(raw as AppEnv)) {
    return raw as AppEnv;
  }

  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  return "development";
}

export function defaultApiOriginForEnv(env: AppEnv = getAppEnv()): string {
  return API_ORIGIN_BY_ENV[env];
}

export function wsOriginFromHttpOrigin(origin: string, pathname: string): string {
  const url = new URL(origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = pathname;
  url.search = "";
  return url.toString();
}
