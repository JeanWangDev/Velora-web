"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface VeloraLogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function VeloraLogo({ className, showWordmark = false }: VeloraLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme !== "light";
  const src = isDark ? "/brand/logo-dark.png" : "/brand/logo-light.png";

  if (showWordmark) {
    return (
      <Image
        src={src}
        alt="Velora Exchange"
        width={140}
        height={36}
        className={className ?? "h-8 w-auto"}
        priority
      />
    );
  }

  return (
    <Image
      src={src}
      alt="Velora"
      width={32}
      height={32}
      className={className ?? "h-8 w-8 object-contain"}
      priority
    />
  );
}
