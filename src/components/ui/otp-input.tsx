"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/cn";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

/** OKX 风格 6 格验证码输入 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  function setAt(index: number, char: string) {
    const next = value.split("");
    while (next.length < length) next.push("");
    next[index] = char;
    onChange(next.join("").replace(/\s/g, "").slice(0, length));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]?.trim()) {
        setAt(index, "");
      } else if (index > 0) {
        setAt(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!text) return;
    onChange(text);
    const focusIndex = Math.min(text.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ? digits[i] : ""}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            if (!char) {
              setAt(i, "");
              return;
            }
            setAt(i, char);
            if (i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "auth-otp-cell h-12 w-10 rounded-lg border border-[#d0d0d0] bg-white text-center text-lg font-semibold text-[#111] outline-none sm:h-14 sm:w-12",
            "focus:border-[#111] focus:ring-1 focus:ring-[#111]",
          )}
        />
      ))}
    </div>
  );
}
