"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "cta" | "ghost" | "auth";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-background hover:opacity-90 disabled:bg-surface-muted disabled:text-muted",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  cta: "bg-cta text-cta-fg hover:opacity-90",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  auth: "auth-btn auth-btn-primary",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "auth" ? "w-full rounded-lg py-3.5 disabled:opacity-100" : "",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
