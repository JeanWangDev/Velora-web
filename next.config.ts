import type { NextConfig } from "next";
import { API_ORIGIN_BY_ENV, getAppEnv } from "./src/config/env";

const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  API_ORIGIN_BY_ENV[getAppEnv()];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = API_PROXY_TARGET.replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${target}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${target}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
