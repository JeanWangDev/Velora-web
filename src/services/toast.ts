export type ToastVariant = "info" | "success" | "error";

export interface ToastPayload {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export const APP_TOAST_EVENT = "app-toast";

function emitToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(APP_TOAST_EVENT, {
      detail: payload,
    }),
  );
}

export const toast = {
  info(title: string, description?: string, duration?: number) {
    emitToast({
      title,
      description,
      duration,
      variant: "info",
    });
  },
  success(title: string, description?: string, duration?: number) {
    emitToast({
      title,
      description,
      duration,
      variant: "success",
    });
  },
  error(title: string, description?: string, duration?: number) {
    emitToast({
      title,
      description,
      duration,
      variant: "error",
    });
  },
};
