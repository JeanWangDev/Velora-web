"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface CaptchaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  checkboxLabel?: string;
}

/**
 * 人机验证弹层（模拟 reCAPTCHA）。
 * 生产环境可替换为真实 Turnstile / reCAPTCHA。
 */
export function CaptchaModal({
  open,
  onClose,
  onSuccess,
  title = "安全验证",
  checkboxLabel = "进行人机身份验证",
}: CaptchaModalProps) {
  const [checked, setChecked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (!open || typeof document === "undefined") return null;

  async function handleVerify() {
    if (!checked || verifying) return;
    setVerifying(true);
    // 模拟校验耗时
    await new Promise((r) => setTimeout(r, 600));
    setVerifying(false);
    setChecked(false);
    onSuccess();
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal
        aria-labelledby="captcha-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="captcha-title" className="text-base font-semibold text-[#111]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#999] hover:bg-[#f5f5f5] hover:text-[#111]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setChecked((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-[#111] transition",
            checked
              ? "border-[#111] bg-[#fafafa]"
              : "border-[#d0d0d0] hover:border-[#999]",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
              checked
                ? "border-[#111] bg-[#111] text-white"
                : "border-[#c8c8c8] bg-white",
            )}
          >
            {checked && (
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span>{checkboxLabel}</span>
          <span className="ml-auto text-[10px] text-[#999]">reCAPTCHA</span>
        </button>

        <button
          type="button"
          disabled={!checked || verifying}
          onClick={() => void handleVerify()}
          className={cn(
            "mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition",
            checked && !verifying
              ? "bg-[#111] text-white hover:bg-[#222]"
              : "cursor-not-allowed bg-[#e8e8e8] text-[#bbb]",
          )}
        >
          {verifying ? "验证中…" : "验证"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
