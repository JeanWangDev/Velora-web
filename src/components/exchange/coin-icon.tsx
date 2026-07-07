"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { getCoinIconUrl } from "@/utils/coin-icon-url";

const COIN_COLORS: Record<string, string> = {
  BTC: "from-[#f7931a] to-[#e8820e]",
  ETH: "from-[#627eea] to-[#4a5fc1]",
  SOL: "from-[#9945ff] to-[#7b2cbf]",
  BNB: "from-[#f3ba2f] to-[#d4a017]",
  DOGE: "from-[#c2a633] to-[#a88b28]",
  XRP: "from-[#23292f] to-[#111]",
};

type CoinIconSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<CoinIconSize, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function CoinIcon({
  base,
  size = "sm",
  className,
}: {
  base: string;
  size?: CoinIconSize;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const upper = base.toUpperCase();
  const box = cn(
    "relative shrink-0 overflow-hidden rounded-full",
    SIZE_CLASS[size],
    className,
  );

  if (!failed) {
    return (
      <span className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getCoinIconUrl(upper)}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        box,
        "flex items-center justify-center bg-gradient-to-br font-bold text-white",
        COIN_COLORS[upper] ?? "from-[#444] to-[#222]",
      )}
    >
      {upper.slice(0, 1)}
    </span>
  );
}
