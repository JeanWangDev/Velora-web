const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "access_token";

const DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function resolveMaxAgeSeconds(expiresAt?: number): number {
  if (!expiresAt || !Number.isFinite(expiresAt)) {
    return DEFAULT_MAX_AGE_SECONDS;
  }

  const seconds = Math.floor((expiresAt - Date.now()) / 1000);
  return Math.max(0, seconds);
}

export function setAccessTokenCookie(token: string, expiresAt?: number) {
  if (typeof document === "undefined") return;

  const maxAge = resolveMaxAgeSeconds(expiresAt);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearAccessTokenCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessTokenCookie(): string {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  return cookie
    ? decodeURIComponent(cookie.split("=").slice(1).join("="))
    : "";
}

export function getAccessTokenExpiresAtCookie(): number | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}_expires_at=`));

  if (!cookie) return null;

  const raw = decodeURIComponent(cookie.split("=").slice(1).join("="));
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setAccessTokenExpiresAtCookie(expiresAt: number) {
  if (typeof document === "undefined") return;

  const maxAge = resolveMaxAgeSeconds(expiresAt);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}_expires_at=${encodeURIComponent(String(expiresAt))}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearAccessTokenExpiresAtCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}_expires_at=; Path=/; Max-Age=0; SameSite=Lax`;
}
