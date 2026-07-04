"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useLocale } from "@/i18n/use-translation";
import {
  AuthPageFrame,
  AuthPromoPanel,
} from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/cn";

type KycStep =
  | "location"
  | "email"
  | "password"
  | "verify"
  | "identity"
  | "done";

const COUNTRIES = [
  { code: "CN", flag: "🇨🇳", zh: "中国", en: "China" },
  { code: "SG", flag: "🇸🇬", zh: "新加坡", en: "Singapore" },
  { code: "AU", flag: "🇦🇺", zh: "澳大利亚", en: "Australia" },
  { code: "US", flag: "🇺🇸", zh: "美国", en: "United States" },
  { code: "JP", flag: "🇯🇵", zh: "日本", en: "Japan" },
  { code: "KR", flag: "🇰🇷", zh: "韩国", en: "South Korea" },
  { code: "GB", flag: "🇬🇧", zh: "英国", en: "United Kingdom" },
  { code: "TR", flag: "🇹🇷", zh: "土耳其", en: "Turkey" },
  { code: "VN", flag: "🇻🇳", zh: "越南", en: "Vietnam" },
  { code: "ID", flag: "🇮🇩", zh: "印度尼西亚", en: "Indonesia" },
];

const ID_TYPES = [
  { id: "id_card", zh: "身份证", en: "ID Card" },
  { id: "passport", zh: "护照", en: "Passport" },
  { id: "driver", zh: "驾驶证", en: "Driver License" },
];

const STEPS: KycStep[] = [
  "location",
  "email",
  "password",
  "verify",
  "identity",
  "done",
];

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
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<KycStep>("location");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState("id_card");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: isZh ? c.zh : c.en,
        icon: c.flag,
      })),
    [isZh],
  );

  if (variant === "modal" && (!open || !mounted)) return null;
  if (variant === "page" && !open) return null;

  const label = (zh: string, en: string) => (isZh ? zh : en);

  async function sendCode() {
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
      toast.success(result.message || label("验证码已发送", "Code sent"));
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : label("发送失败", "Send failed"));
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    setLoading(true);
    setError("");
    try {
      const session = await AuthService.register({
        email: email.trim(),
        code: code.trim(),
        password,
        confirmPassword,
      });
      setSession(session.accessToken, session.user, session.expiresAt);
      setStep("done");
      toast.success(
        label(`注册成功，${session.user.nickname}`, `Welcome, ${session.user.nickname}`),
      );
    } catch (e) {
      // Mock 阶段：后端不可用时仍完成 KYC 演示
      if (e instanceof ApiClientError || e instanceof Error) {
        const msg = e.message;
        if (
          msg.includes("fetch") ||
          msg.includes("Network") ||
          msg.includes("Failed") ||
          (e instanceof ApiClientError && e.status >= 500)
        ) {
          setStep("done");
          toast.success(label("KYC 资料已提交（模拟）", "KYC submitted (mock)"));
          return;
        }
        setError(msg);
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

  function nextFromEmail() {
    if (!email.includes("@")) {
      setError(label("请输入有效邮箱", "Enter a valid email"));
      return;
    }
    setError("");
    setStep("password");
  }

  function nextFromPassword() {
    if (password.length < 8) {
      setError(label("密码至少 8 位", "Password min 8 chars"));
      return;
    }
    if (password !== confirmPassword) {
      setError(label("两次密码不一致", "Passwords do not match"));
      return;
    }
    setError("");
    setStep("verify");
  }

  function nextFromVerify() {
    if (code.trim().length < 4) {
      setError(label("请输入验证码", "Enter verification code"));
      return;
    }
    setError("");
    setStep("identity");
  }

  function nextFromIdentity() {
    if (!fullName.trim()) {
      setError(label("请输入姓名", "Enter your name"));
      return;
    }
    if (!idNumber.trim()) {
      setError(label("请输入证件号码", "Enter ID number"));
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
    const canNext = password.length >= 8 && password === confirmPassword;
    body = (
      <>
        <h1 className="text-2xl font-bold text-[#111]">
          {label("设置登录密码", "Set login password")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label(
            "密码至少 8 位，建议包含大小写字母与数字",
            "At least 8 characters, mix letters and numbers",
          )}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("密码", "Password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={label("输入密码", "Enter password")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("确认密码", "Confirm password")}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={label("再次输入密码", "Re-enter password")}
            />
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

  if (step === "verify") {
    const canNext = code.trim().length >= 4;
    body = (
      <>
        <h1 className="text-2xl font-bold text-[#111]">
          {label("验证邮箱", "Verify email")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label("验证码将发送至", "Code will be sent to")}{" "}
          <span className="font-medium text-[#111]">{email}</span>
        </p>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={label("输入验证码", "Enter code")}
              className="flex-1"
              maxLength={6}
            />
            <button
              type="button"
              disabled={loading || cooldown > 0}
              onClick={() => void sendCode()}
              className="shrink-0 rounded-xl border border-[#e5e5e5] px-4 text-xs font-medium disabled:opacity-50"
            >
              {cooldown > 0
                ? `${cooldown}s`
                : label("获取验证码", "Send code")}
            </button>
          </div>
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {label("开发环境验证码", "Dev code")}: {devCode}
            </p>
          )}
        </div>
        <Button
          variant="auth"
          disabled={!canNext}
          onClick={nextFromVerify}
          className="mt-6"
        >
          {label("继续", "Continue")}
        </Button>
      </>
    );
  }

  if (step === "identity") {
    const canNext = fullName.trim().length > 0 && idNumber.trim().length > 0;
    body = (
      <>
        <h1 className="text-2xl font-bold text-[#111]">
          {label("身份认证 (KYC)", "Identity verification (KYC)")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label(
            "请填写真实身份信息，用于合规审核（当前为模拟流程）",
            "Provide real identity info for compliance (mock flow)",
          )}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("姓名", "Full name")}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={label("与证件一致的姓名", "Name as on ID")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("证件类型", "ID type")}
            </label>
            <div className="flex flex-wrap gap-2">
              {ID_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setIdType(t.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    idType === t.id
                      ? "border-black bg-black text-white"
                      : "border-[#e5e5e5] text-[#111]",
                  )}
                >
                  {isZh ? t.zh : t.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("证件号码", "ID number")}
            </label>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={label("输入证件号码", "Enter ID number")}
            />
          </div>
          <div className="rounded-xl border border-dashed border-[#ddd] bg-[#fafafa] px-4 py-8 text-center text-xs text-[#999]">
            {label(
              "证件照片上传（模拟）— 点击选择文件",
              "ID photo upload (mock) — click to choose",
            )}
          </div>
        </div>
        <Button
          variant="auth"
          disabled={!canNext || loading}
          onClick={nextFromIdentity}
          className="mt-6"
        >
          {loading
            ? label("提交中…", "Submitting…")
            : label("提交认证", "Submit verification")}
        </Button>
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
        <p className="mt-2 max-w-sm text-sm text-[#666]">
          {label(
            "您的账号已创建，KYC 资料已提交审核。审核通过后可使用完整交易功能。",
            "Your account is ready. KYC is under review. Full trading unlocks after approval.",
          )}
        </p>
        <div className="mt-6 w-full rounded-xl bg-[#f7f7f7] p-4 text-left text-xs text-[#666]">
          <p>
            {label("邮箱", "Email")}:{" "}
            <span className="font-medium text-[#111]">{email}</span>
          </p>
          <p className="mt-1">
            {label("所在地", "Location")}:{" "}
            <span className="font-medium text-[#111]">
              {isZh ? selectedCountry?.zh : selectedCountry?.en}
            </span>
          </p>
          <p className="mt-1">
            KYC:{" "}
            <span className="font-medium text-amber-600">
              {label("审核中", "Pending")}
            </span>
          </p>
        </div>
        <Button variant="auth" onClick={onClose} className="mt-6">
          {label("开始交易", "Start trading")}
        </Button>
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

  if (variant === "page") {
    return (
      <AuthPageFrame promo={<AuthPromoPanel variant="trust" />}>
        {formBody}
      </AuthPageFrame>
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
    <div className="fixed inset-0 z-[120] flex bg-black/50">
      <div className="m-auto flex h-[min(92vh,720px)] w-[min(96vw,960px)] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {promo}
        {formPanel}
      </div>
    </div>,
    document.body,
  );
}
