const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "access_token";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

/** 可选：登录后把 JWT 附在 WS URL 上（后端 EVENTS_WS_REQUIRE_AUTH=true 时必填） */
export function appendWsToken(url: string): string {
  const token = getCookie(AUTH_COOKIE_NAME);
  if (!token) return url;

  const parsed = new URL(url);
  parsed.searchParams.set("token", token);
  return parsed.toString();
}
