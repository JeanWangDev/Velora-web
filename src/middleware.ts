import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_URL_LOCALE,
  isUrlLocale,
  type UrlLocale,
} from "@/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/;

const DEFAULT_API_PROXY_TARGET = "https://velora-api-test.aipassly.com";

function apiProxyTarget(): string {
  return (
    process.env.API_PROXY_TARGET?.trim() || DEFAULT_API_PROXY_TARGET
  ).replace(/\/$/, "");
}

function shouldProxyToApi(pathname: string): boolean {
  return pathname.startsWith("/api/v1") || pathname.startsWith("/uploads/");
}

/** Cloudflare / Next：浏览器同源 /api/v1 → 转发到 Velora-api（避免跨域） */
async function proxyToApi(request: NextRequest): Promise<Response> {
  const target = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    apiProxyTarget(),
  );

  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(target, init);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldProxyToApi(pathname)) {
    return proxyToApi(request);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/charting_library") ||
    pathname.startsWith("/brand") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isUrlLocale(first)) {
    const locale = first as UrlLocale;
    const rest = segments.slice(1).join("/");
    const url = request.nextUrl.clone();
    url.pathname = rest ? `/${rest}` : "/";
    const res = NextResponse.rewrite(url);
    res.cookies.set("velora-url-locale", locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    res.headers.set("x-velora-locale", locale);
    return res;
  }

  const cookieLocale = request.cookies.get("velora-url-locale")?.value;
  const locale =
    cookieLocale && isUrlLocale(cookieLocale)
      ? cookieLocale
      : DEFAULT_URL_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/uploads/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
