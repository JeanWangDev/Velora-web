"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/i18n/use-translation";

/** 左侧营销区：垂直居中，内容成组对齐 */
export function AuthPromoPanel({
  variant = "fees",
}: {
  variant?: "fees" | "trust";
}) {
  const locale = useLocale();
  const isZh = locale === "zh";

  if (variant === "trust") {
    return (
      <aside className="relative hidden min-h-[calc(100dvh-48px)] w-[42%] flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-10 text-white lg:flex xl:w-[40%] xl:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.14),transparent_55%)]" />
        <div className="relative z-10 w-full max-w-[320px]">
          <h2 className="text-3xl font-bold leading-snug tracking-tight xl:text-[2rem]">
            {isZh ? (
              <>
                注册奖励最高可达
                <br />
                <span className="text-amber-400">100 USD</span>
              </>
            ) : (
              <>
                Sign-up rewards up to
                <br />
                <span className="text-amber-400">100 USD</span>
              </>
            )}
          </h2>
          <div className="mt-10 space-y-5 text-sm leading-relaxed text-[#b0b0b0]">
            <TrustRow
              icon="🏆"
              text={
                isZh
                  ? "全球超 320 万用户信赖 Velora"
                  : "Trusted by 3.2M+ users worldwide"
              }
            />
            <TrustRow
              icon="🛡️"
              text={
                isZh
                  ? "交易量与用户资产规模行业领先"
                  : "Leading in volume and user assets"
              }
            />
            <TrustRow
              icon="🔗"
              text={
                isZh
                  ? "用户资产安全基金保障，透明可查"
                  : "Transparent user asset security fund"
              }
            />
          </div>
          <div className="mt-12 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-400/20 to-transparent text-3xl">
              🎁
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative hidden min-h-[calc(100dvh-48px)] w-[42%] flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-10 text-white lg:flex xl:w-[40%] xl:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.18),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-[320px] text-center">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-5xl font-black text-black shadow-[0_0_60px_rgba(212,175,55,0.35)]">
          %
        </div>
        <h2 className="text-2xl font-bold xl:text-[1.75rem]">
          {isZh ? "现在注册，享受 0 费率" : "Register now for 0 fees"}
        </h2>
        <div className="mx-auto mt-8 grid grid-cols-2 gap-3 text-left text-xs">
          {[
            [isZh ? "现货吃单" : "Spot taker", "0.00%"],
            [isZh ? "合约吃单" : "Futures taker", "0.01%"],
            [isZh ? "现货挂单" : "Spot maker", "0.00%"],
            [isZh ? "合约挂单" : "Futures maker", "0.00%"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <p className="text-[#888]">{k}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-amber-400">
                {v}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#aaa]">
          {isZh
            ? "所有交易对 0 提币手续费"
            : "0 withdrawal fees on all pairs"}
        </p>
      </div>
    </aside>
  );
}

function TrustRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-lg leading-none">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

/**
 * 全屏分栏：左营销垂直居中，右表单左对齐（对齐 OKX）
 */
export function AuthPageFrame({
  promo,
  children,
}: {
  promo: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100dvh-48px)] w-full">
      {promo}
      <div className="auth-form flex min-h-[calc(100dvh-48px)] min-w-0 flex-1 flex-col justify-center px-8 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
