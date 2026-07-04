import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_URL_LOCALE,
  isUrlLocale,
  type UrlLocale,
} from "@/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // 已有语言前缀：rewrite 到无前缀路径，并写入 cookie
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

  // 无语言前缀：跳转到默认语言
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
