"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";

interface VeloraLogoProps {
  className?: string;
  showWordmark?: boolean;
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-sm",
        className,
      )}
      aria-hidden
    >
      <span className="bg-gradient-to-b from-white to-amber-100 bg-clip-text text-[0.65em] font-black leading-none text-transparent">
        V
      </span>
    </span>
  );
}

export function VeloraLogo({ className, showWordmark = false }: VeloraLogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = !mounted || resolvedTheme !== "light";

  if (showWordmark) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2",
          className,
        )}
      >
        <LogoMark className="h-7 w-7" />
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            isDark ? "text-white" : "text-neutral-900",
          )}
        >
          Velora
        </span>
      </span>
    );
  }

  return <LogoMark className={cn("h-8 w-8", className)} />;
}
