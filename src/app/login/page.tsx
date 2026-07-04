"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, QrCode } from "lucide-react";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import { useLocaleHref } from "@/i18n/locale-path";
import { LocaleLink } from "@/components/ui/locale-link";
import {
  AuthPageFrame,
  AuthPromoPanel,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox-field";
import {
  hasFieldErrors,
  validateLoginForm,
  type AuthFieldErrors,
} from "@/utils/auth-validation";

export default function LoginPage() {
  const t = useTranslation();
  const locale = useLocale();
  const isZh = locale === "zh";
  const router = useRouter();
  const localeHref = useLocaleHref();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [keepLogin, setKeepLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const canSubmit = email.includes("@") && password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateLoginForm({ email, password });
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const session = await AuthService.login({
        email: email.trim(),
        password,
      });
      setSession(session.accessToken, session.user, session.expiresAt);
      toast.success(
        t("loginModal.welcomeBack").replace(
          "{nickname}",
          session.user.nickname,
        ),
      );
      router.push(localeHref("/trade/BTC-USDT"));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("loginModal.operationFailed");
      setFieldErrors({ _form: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageFrame promo={<AuthPromoPanel variant="fees" />}>
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">
          {isZh ? "欢迎使用 Velora" : "Welcome to Velora"}
        </h1>
        <button
          type="button"
          className="auth-muted flex flex-col items-center gap-0.5 text-[10px]"
          onClick={() => toast.info(isZh ? "即将支持" : "Coming soon")}
        >
          <QrCode className="h-5 w-5" />
          {isZh ? "扫码登录" : "Scan"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <Input
          tone="auth"
          label={isZh ? "邮箱/手机号" : "Email / Phone"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            isZh ? "邮箱/手机号(不含区号)" : "Email or phone (no area code)"
          }
          autoComplete="username"
          error={fieldErrors.email}
        />

        <div className="relative">
          <Input
            tone="auth"
            label={isZh ? "密码" : "Password"}
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isZh ? "请输入密码" : "Enter password"}
            autoComplete="current-password"
            error={fieldErrors.password}
            className="pr-11"
            rightSlot={
              <button
                type="button"
                className="auth-muted text-xs hover:opacity-80"
                onClick={() =>
                  toast.info(isZh ? "请联系支持重置" : "Contact support")
                }
              >
                {isZh ? "忘记密码？" : "Forgot password?"}
              </button>
            }
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="auth-muted absolute right-3 top-[38px]"
          >
            {showPwd ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <CheckboxField
          tone="auth"
          checked={keepLogin}
          onChange={(e) => setKeepLogin(e.target.checked)}
        >
          {isZh
            ? "在此设备上保持登录状态 7 天"
            : "Keep me logged in for 7 days"}
        </CheckboxField>

        {fieldErrors._form && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {fieldErrors._form}
          </p>
        )}

        <Button
          type="submit"
          variant="auth"
          disabled={loading || !canSubmit}
          className="mt-2"
        >
          {loading ? t("loginModal.submitting") : t("loginModal.submitLogin")}
        </Button>
      </form>

      <p className="auth-muted mt-5 text-sm">
        {isZh ? "没有账户？" : "No account?"}{" "}
        <LocaleLink href="/register" className="auth-link font-semibold">
          {isZh ? "注册" : "Sign up"}
        </LocaleLink>
      </p>

      <div className="auth-muted my-6 flex items-center gap-3 text-xs">
        <span className="h-px flex-1 bg-auth-border" />
        {isZh ? "或通过以下方式登录" : "Or continue with"}
        <span className="h-px flex-1 bg-auth-border" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["Passkey", "Google", "Apple"].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toast.info(isZh ? "即将支持" : "Coming soon")}
            className="rounded-lg border border-auth-border py-2.5 text-xs font-medium hover:bg-auth-hover"
          >
            {name}
          </button>
        ))}
      </div>
    </AuthPageFrame>
  );
}
