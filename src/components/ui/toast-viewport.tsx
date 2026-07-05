"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  APP_TOAST_EVENT,
  type ToastPayload,
  type ToastVariant,
} from "@/services/toast";

interface ToastItem extends ToastPayload {
  id: string;
}

/** 高对比度样式：浅色用深字 + 白底，深色用浅字 + 实底，避免与页面背景融为一体 */
const variantStyles: Record<
  ToastVariant,
  { container: string; icon: string; description: string }
> = {
  info: {
    container:
      "border-sky-300 bg-white text-slate-900 shadow-sky-100/80 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-50 dark:shadow-black/40",
    icon: "text-sky-600 dark:text-sky-400",
    description: "text-slate-600 dark:text-sky-100/90",
  },
  success: {
    container:
      "border-emerald-300 bg-white text-slate-900 shadow-emerald-100/80 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-50 dark:shadow-black/40",
    icon: "text-emerald-600 dark:text-emerald-400",
    description: "text-slate-600 dark:text-emerald-100/90",
  },
  error: {
    container:
      "border-rose-400 bg-white text-rose-950 shadow-rose-200/80 dark:border-rose-600 dark:bg-slate-900 dark:text-rose-50 dark:shadow-black/40",
    icon: "text-rose-600 dark:text-rose-400",
    description: "text-rose-800 dark:text-rose-100/90",
  },
};

function createToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ToastList({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[250] flex justify-center px-4 sm:top-5">
      <div className="flex w-full max-w-md flex-col gap-3">
        {items.map((item) => {
          const variant = item.variant ?? "info";
          const styles = variantStyles[variant];

          return (
            <div
              key={item.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${styles.container}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
                  {variant === "success" ? (
                    <CircleCheck className="h-5 w-5" />
                  ) : variant === "error" ? (
                    <CircleAlert className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{item.title}</p>
                  {item.description ? (
                    <p className={`mt-1 text-sm leading-snug ${styles.description}`}>
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  aria-label="Dismiss"
                  className="shrink-0 rounded-full p-1 text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                  onClick={() => onDismiss(item.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const mounted = useHydrated();

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;
      const payload = customEvent.detail;
      const id = createToastId();
      const duration =
        payload.duration ?? (payload.variant === "error" ? 6000 : 4000);

      setItems((current) => [...current, { ...payload, id }]);

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, duration);
    }

    window.addEventListener(APP_TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(APP_TOAST_EVENT, handleToast);
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <ToastList
      items={items}
      onDismiss={(id) =>
        setItems((current) => current.filter((item) => item.id !== id))
      }
    />,
    document.body,
  );
}
