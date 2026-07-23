"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import type { AuthModalMode } from "@/types/auth";
import { AppModal } from "@/components/ui/app-modal";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { LoginVerifyModal } from "@/components/auth/login-verify-modal";
import {
  hasFieldErrors,
  mapApiValidationDetails,
  validateForgotForm,
  validateLoginForm,
  validateRegisterForm,
  validateResetForm,
  type AuthFieldErrors,
} from "@/utils/auth-validation";

interface LoginModalProps {
  open?: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
  onGoRegister?: () => void;
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border bg-surface-muted py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-border focus:border-accent focus:ring-accent/40"
  }`;
}

function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-500">{message}</p>;
}

function formatMessage(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function LoginModal({
  open = true,
  onClose,
  initialMode = "login",
  onGoRegister,
}: LoginModalProps) {
  const t = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!open) return;
    logout();
    setFieldErrors({});
  }, [open, logout]);

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [devVerificationCode, setDevVerificationCode] = useState("");
  const [suggestRegister, setSuggestRegister] = useState(false);

  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCodeCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [codeCooldown]);

  const title = useMemo(() => {
    if (mode === "register") return t("loginModal.titleRegister");
    if (mode === "forgot") return t("loginModal.titleForgot");
    if (mode === "reset") return t("loginModal.titleReset");
    return t("loginModal.titleLogin");
  }, [mode, t]);

  function clearField(name: keyof AuthFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function switchMode(next: AuthModalMode) {
    if (next === "register" && onGoRegister) {
      onGoRegister();
      return;
    }
    setMode(next);
    setFieldErrors({});
    setSuggestRegister(false);
    setDevVerificationCode("");
  }

  async function handleSendCode(purpose: "register" | "reset_password") {
    const emailErr = validateForgotForm({ email });
    if (emailErr.email) {
      setFieldErrors({ email: emailErr.email });
      return;
    }

    if (codeCooldown > 0) return;

    setSendingCode(true);
    try {
      const result = await AuthService.sendCode({
        email: email.trim(),
        purpose,
      });
      setCodeCooldown(60);
      toast.success(result.message || t("loginModal.codeSent"));

      if (result.devCode) {
        setDevVerificationCode(result.devCode);
        setVerificationCode(result.devCode);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("loginModal.operationFailed");
      setFieldErrors({ _form: message });
      if (message.includes("频繁") || message.includes("frequent")) {
        setCodeCooldown(60);
      }
    } finally {
      setSendingCode(false);
    }
  }

  async function startLoginChallenge() {
    setVerifyError("");
    setLoading(true);
    try {
      const result = await AuthService.loginChallenge({
        email: email.trim(),
        password,
      });
      setChallengeToken(result.challengeToken);
      setMaskedContact(result.maskedEmail);
      setResendCooldown(60);
      setVerifyOpen(true);
      toast.success(result.message || t("loginModal.codeSent"));
    } catch (error) {
      if (error instanceof ApiClientError) {
        const apiMessage = error.message?.trim() || t("loginModal.operationFailed");
        setFieldErrors({ _form: apiMessage });
        if (
          error.status === 404 ||
          apiMessage.includes("不存在") ||
          apiMessage.includes("注册")
        ) {
          setSuggestRegister(true);
        }
      } else {
        setFieldErrors({
          _form:
            error instanceof Error ? error.message : t("loginModal.operationFailed"),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function completeLogin(code: string) {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      const session = await AuthService.loginVerify({ challengeToken, code });
      setSession(session.accessToken, session.user, session.expiresAt);
      setVerifyOpen(false);
      toast.success(
        formatMessage(t("loginModal.welcomeBack"), {
          nickname: session.user.nickname,
        }),
      );
      onClose();
    } catch (error) {
      setVerifyError(
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("loginModal.operationFailed"),
      );
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    let errors: AuthFieldErrors = {};

    if (mode === "login") {
      errors = validateLoginForm({ email, password });
    } else if (mode === "register") {
      errors = validateRegisterForm({
        email,
        code: verificationCode,
        password,
        confirmPassword,
      });
    } else if (mode === "forgot") {
      errors = validateForgotForm({ email });
    } else if (mode === "reset") {
      errors = validateResetForm({
        email,
        code: verificationCode,
        password,
        confirmPassword,
      });
    }

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSuggestRegister(false);

    if (mode === "login") {
      setCaptchaOpen(true);
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const session = await AuthService.register({
          email: email.trim(),
          code: verificationCode.trim(),
          password,
          confirmPassword,
        });
        setSession(session.accessToken, session.user, session.expiresAt);
        toast.success(
          formatMessage(t("loginModal.registerSuccess"), {
            nickname: session.user.nickname,
          }),
        );
        onClose();
        return;
      }

      if (mode === "forgot") {
        const result = await AuthService.forgotPassword({ email: email.trim() });
        setCodeCooldown(60);
        if (result.devCode) {
          setDevVerificationCode(result.devCode);
          setVerificationCode(result.devCode);
          switchMode("reset");
          toast.success(t("loginModal.forgotDevSuccess"));
        } else {
          switchMode("reset");
          toast.success(result.message || t("loginModal.codeSent"));
        }
        return;
      }

      if (mode === "reset") {
        const session = await AuthService.resetPassword({
          email: email.trim(),
          code: verificationCode.trim(),
          password,
          confirmPassword,
        });
        setSession(session.accessToken, session.user, session.expiresAt);
        toast.success(t("loginModal.resetSuccess"));
        onClose();
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.details) {
        const mapped = mapApiValidationDetails(error.details);
        if (hasFieldErrors(mapped)) {
          setFieldErrors(mapped);
          return;
        }
      }

      if (error instanceof ApiClientError) {
        const apiMessage = error.message?.trim() || t("loginModal.operationFailed");
        setFieldErrors({ _form: apiMessage });
        return;
      }

      const message =
        error instanceof Error ? error.message : t("loginModal.operationFailed");
      setFieldErrors({ _form: message });
    } finally {
      setLoading(false);
    }
  }

  const submitLabel =
    mode === "login"
      ? t("loginModal.submitLogin")
      : mode === "register"
        ? t("loginModal.submitRegister")
        : mode === "forgot"
          ? t("loginModal.submitForgot")
          : t("loginModal.submitReset");

  const showVerificationCode = mode === "register" || mode === "reset";
  const codePurpose = mode === "register" ? "register" : "reset_password";

  return (
    <>
    <AppModal open={open} onClose={onClose} title={title}>
      <div className="mb-4 space-y-1">
        <p className="text-sm text-muted">{t("loginModal.subtitle")}</p>
        {mode === "register" ? (
          <p className="text-xs text-muted">{t("loginModal.registerHint")}</p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {(["login", "register", "forgot"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchMode(tab)}
            className={`rounded-full px-3 py-1 transition ${
              mode === tab || (tab === "forgot" && mode === "reset")
                ? "bg-accent/10 font-semibold text-accent"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            {tab === "login"
              ? t("loginModal.tabLogin")
              : tab === "register"
                ? t("loginModal.tabRegister")
                : t("loginModal.tabForgot")}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              placeholder={t("loginModal.emailPlaceholder")}
              className={`${fieldClass(Boolean(fieldErrors.email))} pl-9 pr-3`}
            />
          </div>
          <FieldHint message={fieldErrors.email} />
        </div>

        {showVerificationCode ? (
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                disabled={loading}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  clearField("verificationCode");
                }}
                placeholder={t("loginModal.verificationCodePlaceholder")}
                className={`${fieldClass(Boolean(fieldErrors.verificationCode))} min-w-0 flex-1 px-3`}
              />
              <button
                type="button"
                disabled={loading || sendingCode || codeCooldown > 0}
                onClick={() => void handleSendCode(codePurpose)}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingCode
                  ? t("loginModal.submitting")
                  : codeCooldown > 0
                    ? formatMessage(t("loginModal.sendCodeCooldown"), {
                        seconds: String(codeCooldown),
                      })
                    : t("loginModal.sendCode")}
              </button>
            </div>
            <FieldHint message={fieldErrors.verificationCode} />
          </div>
        ) : null}

        {mode !== "forgot" ? (
          <>
            <div className="space-y-1">
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField("password");
                }}
                placeholder={
                  mode === "reset"
                    ? t("loginModal.newPasswordPlaceholder")
                    : t("loginModal.passwordPlaceholder")
                }
                className={`${fieldClass(Boolean(fieldErrors.password))} px-3`}
              />
              <FieldHint message={fieldErrors.password} />
            </div>

            {mode === "register" || mode === "reset" ? (
              <div className="space-y-1">
                <input
                  type="password"
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearField("confirmPassword");
                  }}
                  placeholder={t("loginModal.confirmPasswordPlaceholder")}
                  className={`${fieldClass(Boolean(fieldErrors.confirmPassword))} px-3`}
                />
                <FieldHint message={fieldErrors.confirmPassword} />
              </div>
            ) : null}
          </>
        ) : null}

        {mode === "register" || mode === "reset" ? (
          <p className="text-xs text-muted">{t("loginModal.passwordHint")}</p>
        ) : null}

        {devVerificationCode && (mode === "register" || mode === "reset") ? (
          <p className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
            {t("loginModal.devVerificationCode")}: {devVerificationCode}
          </p>
        ) : null}

        {fieldErrors._form ? (
          <div className="space-y-2">
            <p className="rounded-lg border border-rose-400 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100">
              {fieldErrors._form}
            </p>
            {suggestRegister && mode === "login" ? (
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-sm font-medium text-accent hover:underline"
              >
                {t("loginModal.goRegister")}
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t("loginModal.submitting") : submitLabel}
        </button>
      </form>
    </AppModal>

    <CaptchaModal
      open={captchaOpen}
      onClose={() => setCaptchaOpen(false)}
      onSuccess={() => {
        setCaptchaOpen(false);
        void startLoginChallenge();
      }}
    />

    <LoginVerifyModal
      open={verifyOpen}
      onClose={() => setVerifyOpen(false)}
      maskedContact={maskedContact}
      loading={verifyLoading}
      error={verifyError}
      resendCooldown={resendCooldown}
      onResend={() => void startLoginChallenge()}
      onConfirm={(code) => void completeLogin(code)}
    />
    </>
  );
}
