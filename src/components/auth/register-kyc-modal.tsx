"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { AuthService } from "@/services/auth-service";
import { ApiClientError } from "@/services/api-client-error";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useLocale } from "@/i18n/use-translation";
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
  open: boolean;
  onClose: () => void;
  onGoLogin?: () => void;
}

export function RegisterKycModal({
  open,
  onClose,
  onGoLogin,
}: RegisterKycModalProps) {
  const locale = useLocale();
  const isZh = locale === "zh";
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<KycStep>("location");
  const [country, setCountry] = useState("CN");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQ, setCountryQ] = useState("");
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

  const stepIndex = STEPS.indexOf(step);
  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  const filteredCountries = useMemo(() => {
    const q = countryQ.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.zh.includes(q) ||
        c.en.toLowerCase().includes(q),
    );
  }, [countryQ]);

  if (!open || !mounted) return null;

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

  const progress = (
    <div className="mb-6 flex gap-1.5">
      {STEPS.slice(0, -1).map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full",
            i <= stepIndex ? "bg-black" : "bg-[#e5e5e5]",
          )}
        />
      ))}
    </div>
  );

  const inputCls =
    "w-full rounded-xl border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-sm text-black outline-none placeholder:text-[#999] focus:border-black focus:bg-white";

  const primaryBtn = (enabled: boolean) =>
    cn(
      "mt-6 w-full rounded-full py-3.5 text-sm font-semibold transition",
      enabled
        ? "bg-black text-white hover:bg-[#222]"
        : "cursor-not-allowed bg-[#e5e5e5] text-white",
    );

  let body: ReactNode = null;

  if (step === "location") {
    body = (
      <>
        <h1 className="text-2xl font-bold text-black">
          {label("选择您的所在地", "Select your location")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label(
            "请选择居住国家/地区，以便我们为您提供合规服务。",
            "Select your country/region so we can provide compliant services.",
          )}
        </p>
        <div className="mt-8">
          <label className="mb-2 block text-sm font-medium text-black">
            {label("居住国家/地区", "Country/Region of Residence")}
          </label>
          <button
            type="button"
            onClick={() => setCountryOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span>{selectedCountry?.flag}</span>
              <span>
                {isZh ? selectedCountry?.zh : selectedCountry?.en}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-[#999]" />
          </button>
          {countryOpen && (
            <div className="mt-2 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-lg">
              <div className="relative border-b border-[#eee] p-2">
                <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
                <input
                  autoFocus
                  value={countryQ}
                  onChange={(e) => setCountryQ(e.target.value)}
                  placeholder={label("搜索", "Search")}
                  className="w-full rounded-lg bg-[#f5f5f5] py-2 pl-8 pr-3 text-xs outline-none"
                />
              </div>
              <p className="px-3 py-1.5 text-[10px] text-[#999]">
                {label("常用", "Common")}
              </p>
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c.code);
                      setCountryOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f5f5f5]",
                      c.code === country && "bg-[#f0f0f0]",
                    )}
                  >
                    <span>{c.flag}</span>
                    <span>{isZh ? c.zh : c.en}</span>
                    {c.code === country && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={nextFromLocation}
          className={primaryBtn(true)}
        >
          {label("继续", "Continue")}
        </button>
      </>
    );
  }

  if (step === "email") {
    const canNext = email.includes("@");
    body = (
      <>
        <h1 className="text-2xl font-bold text-black">
          {label("添加邮箱地址", "Add email address")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label(
            "邮箱将作为您的登录账号",
            "This email will be your login account",
          )}
        </p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("邮箱", "Email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={label("输入邮箱地址", "Enter email address")}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {label("邀请码 (选填)", "Invitation code (optional)")}
            </label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder={label("输入邀请码", "Enter invitation code")}
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={nextFromEmail}
          className={primaryBtn(canNext)}
        >
          {label("注册", "Sign up")}
        </button>
        <p className="mt-4 text-center text-sm text-[#666]">
          {label("已有账号？", "Already have an account?")}{" "}
          <button
            type="button"
            onClick={onGoLogin}
            className="font-medium text-black underline"
          >
            {label("登录", "Log in")}
          </button>
        </p>
        <div className="my-6 flex items-center gap-3 text-xs text-[#999]">
          <span className="h-px flex-1 bg-[#e5e5e5]" />
          {label("或使用其他方式", "Or continue with")}
          <span className="h-px flex-1 bg-[#e5e5e5]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Google", "Apple", "Telegram", label("Web3 钱包", "Web3 Wallet")].map(
            (name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  toast.info(label("即将支持", "Coming soon"))
                }
                className="rounded-full border border-[#e5e5e5] py-2.5 text-xs font-medium text-black hover:bg-[#f7f7f7]"
              >
                {name}
              </button>
            ),
          )}
        </div>
      </>
    );
  }

  if (step === "password") {
    const canNext = password.length >= 8 && password === confirmPassword;
    body = (
      <>
        <h1 className="text-2xl font-bold text-black">
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
              className={inputCls}
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
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={nextFromPassword}
          className={primaryBtn(canNext)}
        >
          {label("继续", "Continue")}
        </button>
      </>
    );
  }

  if (step === "verify") {
    const canNext = code.trim().length >= 4;
    body = (
      <>
        <h1 className="text-2xl font-bold text-black">
          {label("验证邮箱", "Verify email")}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {label("验证码将发送至", "Code will be sent to")}{" "}
          <span className="font-medium text-black">{email}</span>
        </p>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder={label("输入验证码", "Enter code")}
              className={cn(inputCls, "flex-1")}
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
        <button
          type="button"
          disabled={!canNext}
          onClick={nextFromVerify}
          className={primaryBtn(canNext)}
        >
          {label("继续", "Continue")}
        </button>
      </>
    );
  }

  if (step === "identity") {
    const canNext = fullName.trim().length > 0 && idNumber.trim().length > 0;
    body = (
      <>
        <h1 className="text-2xl font-bold text-black">
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
              className={inputCls}
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
                      : "border-[#e5e5e5] text-black",
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
              className={inputCls}
            />
          </div>
          <div className="rounded-xl border border-dashed border-[#ddd] bg-[#fafafa] px-4 py-8 text-center text-xs text-[#999]">
            {label(
              "证件照片上传（模拟）— 点击选择文件",
              "ID photo upload (mock) — click to choose",
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={!canNext || loading}
          onClick={nextFromIdentity}
          className={primaryBtn(canNext && !loading)}
        >
          {loading
            ? label("提交中…", "Submitting…")
            : label("提交认证", "Submit verification")}
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
        <h1 className="text-2xl font-bold text-black">
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
            <span className="font-medium text-black">{email}</span>
          </p>
          <p className="mt-1">
            {label("所在地", "Location")}:{" "}
            <span className="font-medium text-black">
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
        <button
          type="button"
          onClick={onClose}
          className={primaryBtn(true)}
        >
          {label("开始交易", "Start trading")}
        </button>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex bg-black/50">
      <div className="m-auto flex h-[min(92vh,720px)] w-[min(96vw,960px)] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {promo}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-white p-8 sm:p-10">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-[#999] hover:bg-[#f0f0f0] hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
          {step !== "done" && progress}
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
              className="mt-4 text-center text-xs text-[#999] hover:text-black"
            >
              {label("返回上一步", "Back")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
