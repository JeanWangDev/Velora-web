"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { getPhoneCountry, PHONE_COUNTRIES } from "@/config/phone-countries";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useLocale } from "@/i18n/use-translation";
import {
  AuthPageFrame,
  AuthPromoPanel,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { OtpInput } from "@/components/ui/otp-input";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { cn } from "@/lib/cn";

/**
 * OKX 风格：所在地 → 邮箱 → 人机验证 → 邮箱验证码 → 密码
 *
 * 注册阶段暂不做手机号+短信验证：后端还没有接入真实短信服务商（阿里云/腾讯云 SMS 或
 * Twilio），在没有真实短信通道之前绝不在前端伪造一个"随便填 6 位数字就能过"的假步骤。
 * 手机号绑定放到登录后的"安全设置"里，接入真实短信服务商后再做（跟主流交易所一样分阶段收集）。
 */
type KycStep = "location" | "email" | "emailOtp" | "password" | "done";

const STEPS: KycStep[] = ["location", "email", "emailOtp", "password", "done"];

/** 与后端 validatePasswordField 一致 */
function getPasswordRules(password: string, isZh = true) {
  return [
    {
      key: "len",
      ok: password.length >= 8,
      label: isZh ? "至少 8 位" : "At least 8 characters",
    },
    {
      key: "lower",
      ok: /[a-z]/.test(password),
      label: isZh ? "包含小写字母" : "One lowercase letter",
    },
    {
      key: "upper",
      ok: /[A-Z]/.test(password),
      label: isZh ? "包含大写字母" : "One uppercase letter",
    },
    {
      key: "digit",
      ok: /\d/.test(password),
      label: isZh ? "包含数字" : "One number",
    },
    {
      key: "special",
      ok: /[^A-Za-z0-9]/.test(password),
      label: isZh ? "包含特殊字符" : "One special character",
    },
  ];
}

interface RegisterKycModalProps {
  open?: boolean;
  onClose: () => void;
  onGoLogin?: () => void;
  /** page = 独立注册页；modal = 弹层（兼容旧入口） */
  variant?: "page" | "modal";
}

export function RegisterKycModal({
  open = true,
  onClose,
  onGoLogin,
  variant = "modal",
}: RegisterKycModalProps) {
  const locale = useLocale();
  const isZh = locale === "zh";
  const [step, setStep] = useState<KycStep>("location");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mounted = useHydrated();

  /**
   * 注册流程不做本地持久化：刷新页面即视为放弃当前注册会话，
   * 一律从第一步重新开始（真实交易所不会保留半途而废的身份信息草稿，
   * 且邮箱/短信验证码有时效性，跨刷新恢复反而会导致"验证码错误或已过期"）。
   */
  useEffect(() => {
    if (!open) return;
    setStep("location");
    setError("");
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(
      () => setCooldown((s) => (s <= 1 ? 0 : s - 1)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [cooldown]);

  const selectedCountry = getPhoneCountry(country || "CN");
  const countryOptions = useMemo(
    () =>
      PHONE_COUNTRIES.map((c) => ({
        value: c.iso,
        label: isZh ? c.nameZh : c.nameEn,
        icon: c.flag,
      })),
    [isZh],
  );

  if (variant === "modal" && (!open || !mounted)) return null;
  if (variant === "page" && !open) return null;

  const label = (zh: string, en: string) => (isZh ? zh : en);

  async function sendEmailCode() {
    if (!email.includes("@")) {
      setError(label("请输入有效邮箱", "Enter a valid email"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await AuthService.sendCode({
        email: email.trim(),
        purpose: "register",
      });
      setCooldown(60);
      toast.success(
        result.message || label("验证码已发送至邮箱", "Code sent to email"),
      );
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
      }
    } catch (e) {
      const message =
        e instanceof ApiClientError || e instanceof Error
          ? e.message
          : label("验证码发送失败，请稍后重试", "Failed to send code. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    setLoading(true);
    setError("");
    try {
      await AuthService.register({
        email: email.trim(),
        code: code.trim(),
        password,
        confirmPassword,
      });
      setStep("done");
      toast.success(label("注册成功，请登录", "Registered. Please log in."));
    } catch (e) {
      if (e instanceof ApiClientError || e instanceof Error) {
        setError(e.message);
      } else {
        setError(label("注册失败", "Register failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  function nextFromLocation() {
    if (!country) {
      setError(label("请选择所在地", "Select your location"));
      return;
    }
    setError("");
    setStep("email");
  }

  /** 点注册：先过人机验证 */
  function nextFromEmail() {
    if (!email.includes("@")) {
      setError(label("请输入有效邮箱", "Enter a valid email"));
      return;
    }
    setError("");
    setCaptchaOpen(true);
  }

  function onCaptchaSuccess() {
    setCaptchaOpen(false);
    setStep("emailOtp");
    void sendEmailCode();
  }

  function nextFromEmailOtp() {
    if (code.trim().length !== 6) {
      setError(label("请输入 6 位邮箱验证码", "Enter 6-digit email code"));
      return;
    }
    setError("");
    setStep("password");
  }

  function nextFromPassword() {
    const rules = getPasswordRules(password, isZh);
    const failed = rules.find((r) => !r.ok);
    if (failed) {
      setError(failed.label);
      return;
    }
    if (!confirmPassword) {
      setError(label("请再次输入密码", "Please confirm password"));
      return;
    }
    if (password !== confirmPassword) {
      setError(label("两次输入的密码不一致", "Passwords do not match"));
      return;
    }
    setError("");
    void submitRegister();
  }

  const promo = (
    <div className="hidden flex-col justify-between bg-[#0a0a0a] p-10 text-white lg:flex lg:w-[42%]">
      <div>
        <p className="text-3xl font-bold tracking-tight">
          {label("安心交易！", "Trade with peace of mind!")}
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#aaa]">
          {label(
            "Velora 采用多重风控与资产隔离机制，保障您的资金安全。",
            "Velora uses multi-layer risk controls and asset segregation to protect your funds.",
          )}
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-[#222] bg-[#111] p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[#888]">
            <span>BTC/USDT</span>
            <span className="text-[#98D330]">SPOT</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-[#98D330]">
            72,859.8
          </p>
          <p className="mt-1 text-xs text-[#98D330]">+1.97%</p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {[40, 55, 35, 70, 50, 80, 45, 65, 90, 60, 75, 55].map((h, i) => (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-sm",
                  i % 3 === 0 ? "bg-[#E93E8B]/70" : "bg-[#98D330]/70",
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#222] bg-[#141414] p-4">
        <p className="text-sm font-medium">
          {label("加入我们的社区", "Join our community")}
        </p>
        <p className="mt-1 text-xs text-[#888]">
          {label(
            "获取最新活动与产品动态",
            "Get the latest updates and promotions",
          )}
        </p>
      </div>
    </div>
  );

  let body: ReactNode = null;

  if (step === "location") {
    body = (
      <>
        <h1 className="text-2xl font-bold">
          {label("选择您的所在地", "Select your location")}
        </h1>
        <p className="auth-muted mt-2 text-sm">
          {label(
            "请选择居住国家/地区，以便我们为您提供合规服务。",
            "Select your country/region so we can provide compliant services.",
          )}
        </p>
        <div className="mt-8">
          <SearchableSelect
            label={label("居住国家/地区", "Country/Region of Residence")}
            value={country}
            onChange={setCountry}
            options={countryOptions}
            placeholder={label("请选择居住地", "Please select residence")}
            searchPlaceholder={label("搜索", "Search")}
            sectionTitle={label("常用", "Common")}
            emptyText={label("无匹配结果", "No results")}
          />
        </div>
        <Button
          variant="auth"
          disabled={!country}
          onClick={nextFromLocation}
          className="mt-6"
        >
          {label("注册账户", "Create account")}
        </Button>
        <p className="auth-muted mt-5 text-sm">
          {label("已有账号？", "Already have an account?")}{" "}
          <button
            type="button"
            onClick={onGoLogin}
            className="auth-link font-semibold"
          >
            {label("登录", "Log in")}
          </button>
        </p>
      </>
    );
  }

  if (step === "email") {
    const canNext = email.includes("@");
    body = (
      <>
        <h1 className="text-2xl font-bold">
          {label("添加邮箱地址", "Add email address")}
        </h1>
        <p className="auth-muted mt-2 text-sm">
          {label(
            "邮箱将作为您的登录账号",
            "This email will be your login account",
          )}
        </p>
        <div className="mt-8 space-y-4">
          <Input
            tone="auth"
            label={label("邮箱", "Email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={label("输入邮箱地址", "Enter email address")}
          />
          <Input
            tone="auth"
            label={label("邀请码 (选填)", "Invitation code (optional)")}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={label("输入邀请码", "Enter invitation code")}
          />
        </div>
        <CheckboxField tone="auth" defaultChecked>
          {label(
            "我已阅读并同意隐私声明与用户协议",
            "I agree to the Privacy Policy and Terms of Service",
          )}
        </CheckboxField>
        <Button
          variant="auth"
          disabled={!canNext}
          onClick={nextFromEmail}
          className="mt-6"
        >
          {label("注册", "Sign up")}
        </Button>
        <p className="auth-muted mt-4 text-sm">
          {label("已有账号？", "Already have an account?")}{" "}
          <button
            type="button"
            onClick={onGoLogin}
            className="auth-link font-semibold"
          >
            {label("登录", "Log in")}
          </button>
        </p>
        <div className="auth-muted my-6 flex items-center gap-3 text-xs">
          <span className="h-px flex-1 bg-auth-border" />
          {label("或", "or")}
          <span className="h-px flex-1 bg-auth-border" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Google", "Apple", "Telegram"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toast.info(label("即将支持", "Coming soon"))}
              className="rounded-lg border border-auth-border py-2.5 text-xs font-medium hover:bg-auth-hover"
            >
              {name}
            </button>
          ))}
        </div>
      </>
    );
  }

  if (step === "password") {
    const rules = getPasswordRules(password, isZh);
    const pwdOk = rules.every((r) => r.ok);
    const matchOk =
      confirmPassword.length > 0 && password === confirmPassword;
    const canNext = pwdOk && matchOk;

    body = (
      <>
        <h1 className="text-2xl font-bold">
          {label("设置登录密码", "Set login password")}
        </h1>
        <p className="auth-muted mt-2 text-sm">
          {label(
            "密码需同时满足以下规则",
            "Password must meet all rules below",
          )}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="auth-label mb-1.5 block text-sm font-medium">
              {label("密码", "Password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={label("输入密码", "Enter password")}
                className="auth-input-eye"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="auth-muted absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-1.5">
            {rules.map((r) => (
              <li
                key={r.key}
                className={cn(
                  "flex items-center gap-1.5 text-[11px]",
                  r.ok ? "text-emerald-600" : "text-[#999]",
                )}
              >
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                {r.label}
              </li>
            ))}
          </ul>

          <div>
            <label className="auth-label mb-1.5 block text-sm font-medium">
              {label("确认密码", "Confirm password")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder={label("再次输入密码", "Re-enter password")}
                className="auth-input-eye"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="auth-muted absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !matchOk && (
              <p className="mt-1 text-xs text-rose-500">
                {label("两次输入的密码不一致", "Passwords do not match")}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="auth"
          disabled={!canNext}
          onClick={nextFromPassword}
          className="mt-6"
        >
          {label("继续", "Continue")}
        </Button>
      </>
    );
  }

  if (step === "emailOtp") {
    body = (
      <>
        <h1 className="text-2xl font-bold">
          {label(
            "输入发送到您邮箱地址的 6 位验证码",
            "Enter the 6-digit code sent to your email",
          )}
        </h1>
        <p className="auth-muted mt-2 text-sm">
          {label("请查收发送至", "Check the code sent to")}{" "}
          <span className="font-medium text-auth-text">{email}</span>
          {label(
            " 的验证码。如未收到，请检查垃圾邮件。",
            ". Check spam if you don't see it.",
          )}
        </p>
        <div className="mt-8">
          <OtpInput value={code} onChange={setCode} />
        </div>
        {devCode && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {label("开发环境验证码", "Dev code")}: {devCode}
          </p>
        )}
        {code.length === 6 ? (
          <Button
            variant="auth"
            onClick={nextFromEmailOtp}
            className="mt-6"
          >
            {label("继续", "Continue")}
          </Button>
        ) : (
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={() => void sendEmailCode()}
            className="mt-6 w-full rounded-lg border border-auth-border bg-auth-input py-3.5 text-sm font-semibold text-auth-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0
              ? `${label("重发", "Resend")} (${cooldown}s)`
              : label("重发", "Resend")}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
          }}
          className="auth-link mt-4 w-full text-center text-sm"
        >
          {label("无法验证？更换邮箱", "Can't verify? Change email")}
        </button>
      </>
    );
  }

  if (step === "done") {
    body = (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#98D330]/20">
          <Check className="h-8 w-8 text-[#3a7a00]" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-[#111]">
          {label("注册完成", "Registration complete")}
        </h1>
        <p className="auth-muted mt-2 max-w-sm text-sm">
          {label(
            "您的账号已创建，邮箱已验证。",
            "Your account is ready. Email verified.",
          )}
        </p>
        <div className="mt-6 w-full rounded-xl bg-auth-input p-4 text-left text-xs text-auth-muted">
          <p>
            {label("邮箱", "Email")}:{" "}
            <span className="font-medium text-auth-text">{email}</span>
          </p>
          <p className="mt-1">
            {label("所在地", "Location")}:{" "}
            <span className="font-medium text-auth-text">
              {isZh ? selectedCountry.nameZh : selectedCountry.nameEn}
            </span>
          </p>
        </div>
        <Button
          variant="auth"
          onClick={() => {
            if (onGoLogin) onGoLogin();
            else onClose();
          }}
          className="mt-6"
        >
          {label("去登录", "Go to login")}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="auth-muted mt-3 w-full text-center text-sm hover:text-auth-text"
        >
          {label("稍后再说", "Maybe later")}
        </button>
      </div>
    );
  }

  const formBody = (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}
      {body}
      {step !== "done" && step !== "location" && (
        <button
          type="button"
          onClick={() => {
            setError("");
            const i = STEPS.indexOf(step);
            if (i > 0) setStep(STEPS[i - 1]);
          }}
          className="mt-4 text-center text-xs text-[#999] hover:text-[#111]"
        >
          {label("返回上一步", "Back")}
        </button>
      )}
    </>
  );

  const captcha = (
    <CaptchaModal
      open={captchaOpen}
      onClose={() => setCaptchaOpen(false)}
      onSuccess={onCaptchaSuccess}
      title={label("安全验证", "Security verification")}
      instruction={label(
        "请在下图依次点击",
        "Click the icons below in the order shown above",
      )}
    />
  );

  if (variant === "page") {
    return (
      <>
        <AuthPageFrame promo={<AuthPromoPanel variant="trust" />}>
          {formBody}
        </AuthPageFrame>
        {captcha}
      </>
    );
  }

  const formPanel = (
    <div className="auth-form relative flex min-w-0 flex-1 flex-col overflow-y-auto p-8 sm:px-12 sm:py-10">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1.5 text-[#999] hover:bg-[#f0f0f0] hover:text-[#111]"
      >
        <X className="h-5 w-5" />
      </button>
      {formBody}
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[120] flex bg-black/50">
        <div className="m-auto flex h-[min(92vh,720px)] w-[min(96vw,960px)] overflow-hidden rounded-2xl bg-white shadow-2xl">
          {promo}
          {formPanel}
        </div>
      </div>
      {captcha}
    </>,
    document.body,
  );
}
