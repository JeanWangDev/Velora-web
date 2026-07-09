"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff, QrCode, Search } from "lucide-react";
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
import { LoginVerifyModal } from "@/components/auth/login-verify-modal";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox-field";
import {
  getPhoneCountry,
  isValidPhone,
  normalizePhoneDigits,
  PHONE_COUNTRIES,
} from "@/config/phone-countries";
import {
  hasFieldErrors,
  validateLoginForm,
  type AuthFieldErrors,
} from "@/utils/auth-validation";
import { cn } from "@/lib/cn";

type LoginTab = "phone" | "email" | "qr";

export default function LoginPage() {
  const t = useTranslation();
  const locale = useLocale();
  const isZh = locale === "zh";
  const router = useRouter();
  const localeHref = useLocaleHref();
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // 登录页进入时清掉过期 token，避免后续登录请求被误判为「会话失效」
    logout();
  }, [logout]);

  const [tab, setTab] = useState<LoginTab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [keepLogin, setKeepLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [devCode, setDevCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingAccount, setPendingAccount] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneIso, setPhoneIso] = useState("CN");
  const [dialOpen, setDialOpen] = useState(false);
  const [dialQ, setDialQ] = useState("");
  const dialRef = useRef<HTMLDivElement>(null);

  const phoneCountry = getPhoneCountry(phoneIso);
  const dialOptions = useMemo(() => {
    const q = dialQ.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.dial.includes(q) ||
        c.nameZh.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }, [dialQ]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!dialOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!dialRef.current?.contains(e.target as Node)) setDialOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dialOpen]);

  const phoneDigits = normalizePhoneDigits(phone);
  const canPhoneSubmit =
    isValidPhone(phoneDigits, phoneCountry) && password.length >= 6;
  const canEmailSubmit =
    (email.includes("@") || email.trim().length >= 3) && password.length >= 6;

  async function startLoginChallenge(account: string) {
    setFieldErrors({});
    setVerifyError("");
    setLoading(true);
    try {
      const result = await AuthService.loginChallenge({
        email: account.trim(),
        password: pendingPassword || password,
      });
      setChallengeToken(result.challengeToken);
      setMaskedContact(result.maskedEmail);
      setDevCode(result.devCode ?? "");
      setResendCooldown(60);
      setVerifyOpen(true);
      toast.success(result.message || t("loginModal.codeSent"));
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

  async function completeLogin(code: string) {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      const session = await AuthService.loginVerify({
        challengeToken,
        code,
      });
      setSession(session.accessToken, session.user, session.expiresAt);
      setVerifyOpen(false);
      toast.success(
        t("loginModal.welcomeBack").replace("{nickname}", session.user.nickname),
      );
      router.push(localeHref("/trade/BTC-USDT"));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("loginModal.operationFailed");
      setVerifyError(message);
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResendCode() {
    if (!pendingAccount || resendCooldown > 0) return;
    await startLoginChallenge(pendingAccount);
  }

  async function loginWithAccount(account: string) {
    setPendingAccount(account);
    setPendingPassword(password);
    setCaptchaOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "qr") return;

    if (tab === "phone") {
      if (!canPhoneSubmit) {
        setFieldErrors({
          _form: isZh
            ? `请输入 ${phoneCountry.phoneLength} 位手机号和密码`
            : `Enter ${phoneCountry.phoneLength}-digit phone and password`,
        });
        return;
      }
      // 后端目前按 email 登录；手机号登录先拼成账号标识
      await loginWithAccount(
        `+${phoneCountry.dial}${phoneDigits}@phone.velora.local`,
      );
      return;
    }

    const errors = validateLoginForm({ email, password });
    // 子账户允许非邮箱格式
    if (!email.includes("@") && email.trim().length >= 3) {
      delete errors.email;
    }
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    await loginWithAccount(email);
  }

  const tabs: { key: LoginTab; label: string }[] = [
    { key: "phone", label: isZh ? "手机" : "Phone" },
    { key: "email", label: isZh ? "邮箱 / 子账户" : "Email / Sub-account" },
    { key: "qr", label: isZh ? "二维码" : "QR Code" },
  ];

  return (
    <>
    <AuthPageFrame promo={<AuthPromoPanel variant="trust" />}>
      <h1 className="text-2xl font-bold">
        {isZh ? "欢迎使用 Velora" : "Welcome to Velora"}
      </h1>

      <div className="mt-6 flex gap-5 border-b border-auth-border">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              setFieldErrors({});
            }}
            className={cn(
              "pb-2.5 text-sm font-medium transition",
              tab === item.key
                ? "border-b-2 border-auth-text text-auth-text"
                : "text-auth-muted hover:text-auth-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "qr" ? (
        <div className="flex flex-col items-center py-10">
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-auth-border bg-auth-input">
            <QrCode className="h-28 w-28 text-auth-text opacity-80" />
          </div>
          <p className="auth-muted mt-4 text-center text-sm">
            {isZh
              ? "请使用 Velora App 扫码登录"
              : "Scan with Velora App to log in"}
          </p>
          <p className="auth-muted mt-1 text-center text-xs">
            {isZh ? "二维码登录即将上线" : "QR login coming soon"}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {tab === "phone" ? (
            <div>
              <label className="auth-label mb-1.5 block text-sm font-medium">
                {isZh ? "手机号" : "Phone number"}
              </label>
              <div
                className="auth-phone-field relative flex overflow-visible rounded-xl border border-auth-border bg-auth-input"
                ref={dialRef}
              >
                <button
                  type="button"
                  onClick={() => setDialOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-1 border-r border-auth-border px-3 py-3 text-sm font-medium text-auth-text hover:bg-auth-hover"
                >
                  <span className="auth-flag text-sm">{phoneCountry.flag}</span>
                  <span>+{phoneCountry.dial}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-50 transition",
                      dialOpen && "rotate-180",
                    )}
                  />
                </button>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, phoneCountry.phoneLength),
                    );
                    setFieldErrors({});
                  }}
                  placeholder={
                    isZh
                      ? `${phoneCountry.phoneLength} 位手机号`
                      : `${phoneCountry.phoneLength}-digit number`
                  }
                  className="auth-phone-input min-w-0 flex-1"
                  maxLength={phoneCountry.phoneLength}
                />
                {dialOpen && (
                  <div className="auth-dropdown auth-dial-menu">
                    <div className="px-2 pt-2 pb-1">
                      <div className="auth-search-wrap">
                        <Search className="auth-search-icon" aria-hidden />
                        <input
                          autoFocus
                          value={dialQ}
                          onChange={(e) => setDialQ(e.target.value)}
                          placeholder={isZh ? "搜索国家/区号" : "Search"}
                          className="auth-search"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto pb-1">
                      {dialOptions.map((c) => (
                        <button
                          key={c.iso}
                          type="button"
                          onClick={() => {
                            setPhoneIso(c.iso);
                            setPhone("");
                            setDialOpen(false);
                            setDialQ("");
                          }}
                          className={cn(
                            "auth-dropdown-item",
                            c.iso === phoneIso && "is-active",
                          )}
                        >
                          <span className="auth-flag">{c.flag}</span>
                          <span className="min-w-0 flex-1 truncate">
                            {isZh ? c.nameZh : c.nameEn}
                          </span>
                          <span className="font-mono text-auth-muted">
                            +{c.dial}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="auth-muted mt-1.5 text-xs">
                {isZh
                  ? `${phoneCountry.nameZh}手机号 ${phoneCountry.phoneLength} 位（已输入 ${phone.length} 位）`
                  : `${phoneCountry.nameEn}: ${phoneCountry.phoneLength} digits (${phone.length} entered)`}
              </p>
            </div>
          ) : (
            <Input
              tone="auth"
              label={isZh ? "邮箱 / 子账户" : "Email / Sub-account"}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                isZh
                  ? "邮箱或子账户名"
                  : "Email or sub-account"
              }
              autoComplete="username"
              error={fieldErrors.email}
            />
          )}

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
              className="auth-input-eye"
              rightSlot={
                <button
                  type="button"
                  className="auth-muted text-xs hover:opacity-80"
                  onClick={() =>
                    toast.info(
                      isZh
                        ? "请通过顶部「登录」弹窗中的「找回密码」"
                        : "Use Forgot password in the login dialog",
                    )
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
            disabled={
              loading || (tab === "phone" ? !canPhoneSubmit : !canEmailSubmit)
            }
            className="mt-2"
          >
            {loading ? t("loginModal.submitting") : t("loginModal.submitLogin")}
          </Button>
        </form>
      )}

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

    <CaptchaModal
      open={captchaOpen}
      onClose={() => setCaptchaOpen(false)}
      title={isZh ? "安全验证" : "Security check"}
      instruction={isZh ? "请在下图依次点击" : "Tap icons in order"}
      onSuccess={() => {
        setCaptchaOpen(false);
        if (pendingAccount) void startLoginChallenge(pendingAccount);
      }}
    />

    <LoginVerifyModal
      open={verifyOpen}
      onClose={() => setVerifyOpen(false)}
      maskedContact={maskedContact}
      devCode={devCode}
      loading={verifyLoading}
      error={verifyError}
      resendCooldown={resendCooldown}
      onResend={() => void handleResendCode()}
      onConfirm={(code) => void completeLogin(code)}
      title={isZh ? "使用邮箱验证" : "Email verification"}
      confirmLabel={isZh ? "确认" : "Confirm"}
      resendLabel={isZh ? "重新发送" : "Resend"}
      helpLabel={isZh ? "无法验证？" : "Can't verify?"}
    />
    </>
  );
}
