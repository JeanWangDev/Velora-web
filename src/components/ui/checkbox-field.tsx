"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  children: ReactNode;
  tone?: "default" | "auth";
}

export function CheckboxField({
  children,
  className,
  tone = "default",
  ...props
}: CheckboxFieldProps) {
  if (tone === "auth") {
    return (
      <label className={cn("auth-check", className)}>
        <input type="checkbox" {...props} />
        <span>{children}</span>
      </label>
    );
  }

  return (
    <label
      className={cn(
        "flex items-start gap-2 text-xs text-muted",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
        {...props}
      />
      <span>{children}</span>
    </label>
  );
}
