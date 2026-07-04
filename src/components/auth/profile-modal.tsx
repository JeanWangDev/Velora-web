"use client";

import { useState } from "react";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { UserAvatar } from "@/components/auth/user-avatar";
import { AppModal } from "@/components/ui/app-modal";
import {
  hasFieldErrors,
  mapApiValidationDetails,
  validateProfileForm,
  type AuthFieldErrors,
} from "@/utils/auth-validation";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border bg-surface-muted px-3 py-2.5 text-sm text-foreground outline-none transition focus:ring-1 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-border focus:border-accent focus:ring-accent/40"
  }`;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const t = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const previewNickname = nickname.trim() || user.nickname;
  const isDirty = nickname.trim() !== user.nickname;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const errors = validateProfileForm({ nickname });
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    if (!isDirty) {
      setFormNotice(t("profileModal.unchanged"));
      return;
    }

    setFormNotice(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await AuthService.updateProfile({ nickname: nickname.trim() });
      setUser(result.user);
      toast.success(t("profileModal.saveSuccess"));
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError && error.details) {
        const mapped = mapApiValidationDetails(error.details);
        if (hasFieldErrors(mapped)) {
          setFieldErrors(mapped);
          return;
        }
      }
      const message =
        error instanceof Error ? error.message : t("profileModal.saveFailed");
      setFieldErrors({ _form: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onClose={onClose} title={t("profileModal.title")}>
      <div className="mb-5 flex items-center gap-3">
        <UserAvatar nickname={previewNickname} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {previewNickname}
          </p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted">{t("profileModal.nickname")}</span>
          <input
            type="text"
            value={nickname}
            maxLength={64}
            disabled={loading}
            onChange={(event) => {
              setNickname(event.target.value);
              setFormNotice(null);
              setFieldErrors((prev) => {
                if (!prev.nickname) return prev;
                const next = { ...prev };
                delete next.nickname;
                return next;
              });
            }}
            className={fieldClass(Boolean(fieldErrors.nickname))}
          />
          {fieldErrors.nickname ? (
            <p className="text-xs text-rose-500">{fieldErrors.nickname}</p>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted">{t("profileModal.email")}</span>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 text-sm text-muted"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted">{t("profileModal.role")}</span>
          <input
            type="text"
            value={user.roleName}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 text-sm text-muted"
          />
        </label>

        {formNotice ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            {formNotice}
          </p>
        ) : null}

        {fieldErrors._form ? (
          <p className="rounded-lg border border-rose-400 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100">
            {fieldErrors._form}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40 disabled:opacity-60"
          >
            {t("profileModal.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("profileModal.saving") : t("profileModal.save")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
