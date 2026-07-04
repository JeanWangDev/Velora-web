"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 弹框内容区额外 class，默认 max-w-md */
  panelClassName?: string;
  /** 是否显示右上角关闭按钮，默认 true */
  showCloseButton?: boolean;
}

/**
 * 全站统一弹框：Portal 挂到 body，避免 header 的 backdrop-filter 导致 fixed 错位。
 */
export function AppModal({
  open,
  onClose,
  title,
  children,
  panelClassName = "max-w-md",
  showCloseButton = true,
}: AppModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[min(90vh,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {showCloseButton ? (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
