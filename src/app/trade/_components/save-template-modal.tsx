"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getIndicatorById } from "@/app/trade/_config/indicators";
import { formatIndicatorDisplayLabel } from "@/app/trade/_config/indicator-display";
import { ChartTemplateService } from "@/services/chart-template-service";
import { buildDefaultTemplateName } from "@/utils/chart-template";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";

type SaveTemplateModalProps = {
  open: boolean;
  onClose: () => void;
  symbol: string;
  symbolId?: number | null;
  indicatorIds: string[];
  onSaved?: () => void;
};

export function SaveTemplateModal({
  open,
  onClose,
  symbol,
  symbolId,
  indicatorIds,
  onSaved,
}: SaveTemplateModalProps) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [includeSymbol, setIncludeSymbol] = useState(true);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultName = buildDefaultTemplateName(symbol);
    setName(defaultName);
    setIncludeSymbol(Boolean(symbol));
    setVisibility("private");
    setIsDefault(false);
  }, [open, symbol, indicatorIds, t]);

  if (!open) return null;

  const indicatorLabels = indicatorIds.map((id) => {
    const def = getIndicatorById(id);
    return def ? formatIndicatorDisplayLabel(def) : id;
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("trade.templates.nameRequired"));
      return;
    }
    if (indicatorIds.length === 0) {
      toast.error(t("trade.templates.noIndicators"));
      return;
    }

    setSubmitting(true);
    try {
      await ChartTemplateService.create({
        name: name.trim(),
        symbolId: includeSymbol ? (symbolId ?? null) : null,
        symbol: includeSymbol ? symbol : "",
        indicatorIds,
        visibility,
        isDefault: visibility === "private" ? isDefault : false,
      });
      toast.success(t("trade.templates.saved"));
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("trade.templates.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-title"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="save-template-title" className="text-sm font-semibold text-foreground">
            {t("trade.templates.saveTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              {t("trade.templates.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              placeholder={t("trade.templates.namePlaceholder")}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={includeSymbol}
              onChange={(e) => setIncludeSymbol(e.target.checked)}
              className="rounded border-border"
            />
            {t("trade.templates.includeSymbol")}{" "}
            <span className="font-medium text-foreground">{symbol}</span>
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">{t("trade.templates.visibilityLabel")}</p>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="template-visibility"
                  checked={visibility === "private"}
                  onChange={() => {
                    setVisibility("private");
                  }}
                  className="border-border"
                />
                {t("trade.templates.visibilityPrivate")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="template-visibility"
                  checked={visibility === "public"}
                  onChange={() => {
                    setVisibility("public");
                    setIsDefault(false);
                  }}
                  className="border-border"
                />
                {t("trade.templates.visibilityPublic")}
              </label>
            </div>
          </div>

          {visibility === "private" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border"
              />
              {t("trade.templates.setAsDefault")}
            </label>
          ) : null}

          <div>
            <p className="mb-1 text-xs font-medium text-muted">
              {t("trade.templates.indicatorPreview")} ({indicatorIds.length})
            </p>
            <ul className="max-h-32 overflow-y-auto rounded-md border border-border bg-background/50 px-3 py-2 text-xs text-foreground">
              {indicatorLabels.map((label) => (
                <li key={label} className="py-0.5">
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            {t("trade.indicatorPanel.cancel")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("trade.templates.saveConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
