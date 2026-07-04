"use client";

import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
  submitting?: boolean;
};

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger = false,
  submitting = false,
}: ConfirmModalProps) {
  return (
    <AppModal open={open} onClose={onClose} title={title} panelClassName="max-w-sm">
      <p className="mb-5 text-sm text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void onConfirm()}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 ${
            danger ? "bg-rose-600" : "bg-accent"
          }`}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </AppModal>
  );
}
