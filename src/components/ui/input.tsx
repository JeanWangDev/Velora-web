"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
  /** auth = 白底认证表单样式（走 .auth-form 全局） */
  tone?: "default" | "auth";
}

export function Input({
  label,
  hint,
  error,
  rightSlot,
  tone = "default",
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  if (tone === "auth") {
    return (
      <div className="w-full">
        {(label || rightSlot) && (
          <div className="mb-1.5 flex items-center justify-between">
            {label ? (
              <label htmlFor={inputId} className="auth-label text-sm font-medium">
                {label}
              </label>
            ) : (
              <span />
            )}
            {rightSlot}
          </div>
        )}
        <input id={inputId} className={className} {...props} />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {hint && !error && <p className="auth-muted mt-1 text-xs">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {(label || rightSlot) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label ? (
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-foreground"
            >
              {label}
            </label>
          ) : (
            <span />
          )}
          {rightSlot}
        </div>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-foreground focus:bg-surface",
          error && "border-rose-500",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
