"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, X } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];
const ACCEPT_EXT = ".jpg,.jpeg,.png";

export interface UploadedDoc {
  name: string;
  previewUrl: string;
}

interface KycDocUploadZoneProps {
  value: UploadedDoc | null;
  onChange: (doc: UploadedDoc | null) => void;
  /** 移动端调起相机 */
  enableCamera?: boolean;
}

function validateFile(file: File, t: (k: string) => string): boolean {
  if (!ACCEPT.includes(file.type)) {
    toast.error(t("user.kycFileInvalid"));
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast.error(t("user.kycFileTooLarge"));
    return false;
  }
  return true;
}

export function KycDocUploadZone({
  value,
  onChange,
  enableCamera = true,
}: KycDocUploadZoneProps) {
  const t = useExchangeT();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!validateFile(file, t)) return;
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
      onChange({
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    },
    [onChange, t, value?.previewUrl],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files[0]);
  }

  function clear() {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt=""
            className="mx-auto max-h-56 w-full object-contain p-4"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-3 rounded-full bg-surface/90 p-1.5 shadow-sm ring-1 ring-border transition hover:bg-surface"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="border-t border-border px-3 py-2 text-center text-xs text-muted">
            {value.name}
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center transition",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-surface-muted/20 hover:border-primary/40",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface ring-1 ring-border">
            <ImagePlus className="h-5 w-5 text-muted" />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {t("user.kycUploadDrop")}
          </button>
          {enableCamera ? (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary"
            >
              <Camera className="h-3.5 w-3.5" />
              {t("user.kycUploadOrScan")}
            </button>
          ) : null}
          <p className="mt-3 text-xs text-muted">{t("user.kycUploadFormats")}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_EXT}
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {enableCamera ? (
        <input
          ref={cameraRef}
          type="file"
          accept={ACCEPT_EXT}
          capture="environment"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      ) : null}
    </div>
  );
}

export function KycPrivacyFooter() {
  const t = useExchangeT();
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      {t("user.kycPrivacyNote")}
    </p>
  );
}

export function KycPrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-full py-3.5 text-sm font-semibold transition",
        disabled
          ? "cursor-not-allowed bg-surface-muted text-muted"
          : "bg-neutral-900 text-white hover:opacity-90 dark:bg-white dark:text-neutral-900",
      )}
    >
      {children}
    </button>
  );
}

export function KycWizardBack({ onClick }: { onClick: () => void }) {
  const t = useExchangeT();
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 text-sm text-muted transition hover:text-foreground"
    >
      ← {t("common.back")}
    </button>
  );
}
