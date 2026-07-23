"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface LoginVerifyModalProps {
  open: boolean;
  onClose: () => void;
  maskedContact: string;
  loading?: boolean;
  error?: string;
  onResend?: () => void;
  resendCooldown?: number;
  onConfirm: (code: string) => void;
  title?: string;
  instruction?: string;
  confirmLabel?: string;
  resendLabel?: string;
  helpLabel?: string;
}

export function LoginVerifyModal({
  open,
  onClose,
  maskedContact,
  loading = false,
  error,
  onResend,
  resendCooldown = 0,
  onConfirm,
  title = "安全验证",
  instruction,
  confirmLabel = "确认",
  resendLabel = "重新发送",
  helpLabel = "无法验证？",
}: LoginVerifyModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) {
      setDigits(Array(6).fill(""));
      return;
    }
    window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [open]);

  const code = digits.join("");
  const canConfirm = code.length === 6 && !loading;

  function updateDigit(index: number, value: string) {
    const next = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    if (next && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(pasted.padEnd(6, "").split("").slice(0, 6));
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  if (!open || typeof document === "undefined") return null;

  const defaultInstruction = `请输入发送至 ${maskedContact} 的 6 位验证码`;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-2xl bg-white p-6 text-[var(--auth-text)] shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--auth-text)]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--auth-muted)]">
              {instruction ?? defaultInstruction}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-[var(--auth-placeholder)] hover:bg-[var(--auth-hover)] hover:text-[var(--auth-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e.key)}
              className={cn(
                "h-12 w-11 rounded-lg border bg-white text-center text-lg font-semibold tabular-nums text-[var(--auth-text)] outline-none transition [-webkit-text-fill-color:var(--auth-text)]",
                error
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  : "border-[var(--auth-border)] focus:border-[var(--auth-border-focus)] focus:ring-2 focus:ring-[#111]/10",
              )}
            />
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-center text-xs text-rose-600">{error}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--auth-muted)]">
          <button type="button" className="hover:text-[var(--auth-text)]" onClick={onClose}>
            {helpLabel}
          </button>
          {onResend ? (
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={onResend}
              className="font-medium text-[var(--auth-text)] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resendCooldown > 0
                ? `${resendLabel} (${resendCooldown}s)`
                : resendLabel}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(code)}
          className={cn(
            "mt-5 w-full rounded-lg py-3 text-sm font-semibold transition",
            canConfirm
              ? "bg-[#111] text-white hover:bg-[#222]"
              : "cursor-not-allowed bg-[var(--auth-hover)] text-[var(--auth-placeholder)]",
          )}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              验证中…
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </div>,
    document.body,
  );
}
