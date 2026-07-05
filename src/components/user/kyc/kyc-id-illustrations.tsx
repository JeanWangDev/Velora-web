"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "correct" | "corners" | "glare" | "blur";

interface IdCardIllustrationProps {
  variant?: Variant;
  className?: string;
}

/** 身份证示意 SVG — OKX 风格线稿 */
export function IdCardIllustration({
  variant = "correct",
  className,
}: IdCardIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="id-bg" x1="0" y1="0" x2="160" y2="100">
          <stop offset="0%" stopColor="#E8EEF4" />
          <stop offset="100%" stopColor="#D4DEE8" />
        </linearGradient>
        <linearGradient id="id-glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="id-blur">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* 卡片主体 */}
      <g
        filter={variant === "blur" ? "url(#id-blur)" : undefined}
        opacity={variant === "blur" ? 0.55 : 1}
      >
        <rect
          x={variant === "corners" ? 14 : 8}
          y={variant === "corners" ? 10 : 8}
          width={variant === "corners" ? 132 : 144}
          height={variant === "corners" ? 76 : 84}
          rx="6"
          fill="url(#id-bg)"
          stroke="#B8C4D0"
          strokeWidth="1.2"
        />

        {/* 国徽区简化 */}
        <circle cx="28" cy="28" r="8" fill="#C5D0DB" opacity="0.9" />
        <rect x="18" y="42" width="20" height="2" rx="1" fill="#A8B8C8" />
        <rect x="18" y="48" width="16" height="2" rx="1" fill="#A8B8C8" />

        {/* 人像 */}
        <circle cx="52" cy="48" r="16" fill="#BCCAD6" stroke="#9AABB8" strokeWidth="1" />
        <ellipse cx="52" cy="44" rx="10" ry="8" fill="#A8B8C8" />
        <path
          d="M38 58 Q52 52 66 58 L66 64 Q52 60 38 64 Z"
          fill="#A8B8C8"
        />

        {/* 文字行 */}
        <rect x="76" y="24" width="56" height="3" rx="1.5" fill="#9AABB8" />
        <rect x="76" y="32" width="48" height="3" rx="1.5" fill="#A8B8C8" />
        <rect x="76" y="40" width="52" height="3" rx="1.5" fill="#A8B8C8" />
        <rect x="76" y="48" width="40" height="3" rx="1.5" fill="#B8C4D0" />
        <rect x="76" y="56" width="44" height="3" rx="1.5" fill="#B8C4D0" />
        <rect x="76" y="64" width="36" height="3" rx="1.5" fill="#C5D0DB" />

        {/* 反光 */}
        {variant === "glare" ? (
          <ellipse cx="100" cy="38" rx="36" ry="22" fill="url(#id-glare)" />
        ) : null}

        {/* 遮挡 */}
        {variant === "glare" ? (
          <rect x="118" y="30" width="28" height="36" rx="4" fill="#8A9AAD" opacity="0.45" />
        ) : null}
      </g>

      {/* 四角扫描框 — 正确示例 */}
      {variant === "correct" ? (
        <g stroke="#22C55E" strokeWidth="2" strokeLinecap="round">
          <path d="M4 18 V8 H14" />
          <path d="M146 8 H156 V18" />
          <path d="M156 82 V92 H146" />
          <path d="M14 92 H4 V82" />
        </g>
      ) : null}

      {/* 缺角示意 */}
      {variant === "corners" ? (
        <>
          <path
            d="M8 8 H50 V8"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.6"
          />
          <line x1="8" y1="8" x2="20" y2="20" stroke="#EF4444" strokeWidth="1.5" opacity="0.5" />
        </>
      ) : null}
    </svg>
  );
}

/** 上传页 — 取景框 + 证件 */
export function IdCardScanIllustration({ className }: { className?: string }) {
  const corner =
    "absolute h-5 w-5 border-muted-foreground/60";
  return (
    <div className={cn("relative mx-auto h-32 w-52 py-2", className)}>
      <div className="relative mx-auto flex h-full max-w-[180px] items-center justify-center rounded-lg bg-[#1a1f26]/80 px-4 ring-1 ring-white/10">
        <span className={cn(corner, "left-3 top-2 border-l-2 border-t-2")} />
        <span className={cn(corner, "right-3 top-2 border-r-2 border-t-2")} />
        <span className={cn(corner, "bottom-2 left-3 border-b-2 border-l-2")} />
        <span className={cn(corner, "bottom-2 right-3 border-b-2 border-r-2")} />
        <IdCardIllustration variant="correct" className="max-h-[72px] max-w-[130px]" />
      </div>
    </div>
  );
}

interface GuideExampleProps {
  label: string;
  variant: Variant;
  ok: boolean;
  size?: "lg" | "sm";
}

export function KycGuideExample({ label, variant, ok, size = "sm" }: GuideExampleProps) {
  const isLg = size === "lg";

  return (
    <div className={cn("flex flex-col items-center", isLg ? "gap-2" : "gap-1.5")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-[#1a1f26] ring-1 ring-white/10",
          isLg ? "h-32 w-full max-w-[220px] px-6 py-4" : "h-[72px] w-full px-2 py-2",
        )}
      >
        <IdCardIllustration
          variant={variant}
          className={isLg ? "max-h-[88px]" : "max-h-[52px]"}
        />
      </div>
      <p
        className={cn(
          "text-center leading-snug text-muted",
          isLg ? "text-sm" : "text-[11px]",
        )}
      >
        {label}
      </p>
      {ok ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/15">
          <X className="h-3.5 w-3.5 text-rose-500" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

/** 指引页完整示例区 */
export function KycGuideExamples({ labels }: { labels: { example: string; corners: string; glare: string; clear: string } }) {
  return (
    <div className="space-y-6">
      <KycGuideExample label={labels.example} variant="correct" ok size="lg" />
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <KycGuideExample label={labels.corners} variant="correct" ok />
        <KycGuideExample label={labels.glare} variant="glare" ok={false} />
        <KycGuideExample label={labels.clear} variant="blur" ok={false} />
      </div>
    </div>
  );
}
