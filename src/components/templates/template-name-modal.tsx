"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { useTranslation } from "@/i18n/use-translation";

type TemplateNameModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  initialName: string;
  confirmLabel: string;
  onConfirm: (name: string) => Promise<void>;
};

export function TemplateNameModal({
  open,
  onClose,
  title,
  description,
  initialName,
  confirmLabel,
  onConfirm,
}: TemplateNameModalProps) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSubmitting(false);
  }, [open, initialName]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} title={title} panelClassName="max-w-md">
      {description ? <p className="mb-4 text-sm text-muted">{description}</p> : null}

      <label className="mb-1 block text-xs font-medium text-muted">
        {t("templatesPage.nameLabel")}
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={128}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent/40"
        placeholder={t("templatesPage.namePlaceholder")}
      />

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40 disabled:opacity-60"
        >
          {t("templatesPage.cancel")}
        </button>
        <button
          type="button"
          disabled={submitting || !name.trim()}
          onClick={() => void handleSubmit()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {confirmLabel}
        </button>
      </div>
    </AppModal>
  );
}
