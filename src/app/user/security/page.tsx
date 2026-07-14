"use client";

import { useEffect, useState } from "react";
import { KeyRound, Shield, Smartphone } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { SecurityService } from "@/services/security-service";
import { formatDateTime } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { isChineseLocale } from "@/i18n/locale-helpers";

interface LoginRow {
  ip: string;
  device: string;
  ts: number;
}

export default function UserSecurityPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = isChineseLocale(locale);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [sessions, setSessions] = useState<
    { id: number; ip: string; device: string; ts: number }[]
  >([]);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [totpOpen, setTotpOpen] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUrl, setTotpUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  useEffect(() => {
    void SecurityService.status2fa()
      .then((r) => setTotpEnabled(r.enabled))
      .catch(() => {});
    void SecurityService.loginHistory()
      .then((r) => setLogins(r.rows ?? []))
      .catch(() => setLogins([]));
    void SecurityService.listSessions()
      .then((r) => setSessions(r.rows ?? []))
      .catch(() => setSessions([]));
  }, []);

  const revokeSession = async (id: number) => {
    try {
      await SecurityService.revokeSession(id);
      setSessions((list) => list.filter((s) => s.id !== id));
      toast.success(isZh ? "已踢下线" : "Session revoked");
    } catch {
      toast.error(isZh ? "操作失败" : "Failed");
    }
  };

  const start2fa = async () => {
    try {
      const res = await SecurityService.setup2fa();
      setTotpSecret(res.secret);
      setTotpUrl(res.otpauthUrl);
      setTotpOpen(true);
    } catch {
      toast.error(isZh ? "获取 2FA 密钥失败" : "Failed to start 2FA setup");
    }
  };

  const confirm2fa = async () => {
    try {
      await SecurityService.verify2fa(totpCode);
      setTotpEnabled(true);
      setTotpOpen(false);
      setTotpCode("");
      toast.success(isZh ? "两步验证已启用" : "2FA enabled");
    } catch {
      toast.error(isZh ? "验证码错误" : "Invalid code");
    }
  };

  const disable2fa = async () => {
    const code = window.prompt(isZh ? "输入 Google Authenticator 验证码以关闭 2FA" : "Enter TOTP code to disable 2FA");
    if (!code) return;
    try {
      await SecurityService.disable2fa(code);
      setTotpEnabled(false);
      toast.success(isZh ? "两步验证已关闭" : "2FA disabled");
    } catch {
      toast.error(isZh ? "验证码错误" : "Invalid code");
    }
  };

  const submitPassword = async () => {
    if (newPwd !== confirmPwd) {
      toast.error(isZh ? "两次密码不一致" : "Passwords do not match");
      return;
    }
    try {
      await SecurityService.changePassword(currentPwd, newPwd);
      setPwdOpen(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success(isZh ? "密码已更新" : "Password updated");
    } catch {
      toast.error(isZh ? "修改失败，请检查当前密码" : "Failed to change password");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("user.security")}</h1>
        <p className="mt-1 text-sm text-muted">{t("user.securityHint")}</p>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium">
            {isZh ? "两步验证 (2FA)" : "Two-factor authentication (2FA)"}
          </h2>
        </div>

        <SecurityRow
          icon={KeyRound}
          title={t("user.changePassword")}
          desc={isZh ? "定期更新密码可提升账户安全" : "Update your password regularly"}
          status={isZh ? "已设置" : "Set"}
          statusOk
          action={isZh ? "修改" : "Change"}
          onAction={() => setPwdOpen(true)}
        />
        <SecurityRow
          icon={Smartphone}
          title={t("user.twoFa")}
          desc={
            totpEnabled
              ? isZh ? "Google Authenticator 已启用" : "Google Authenticator enabled"
              : isZh ? "建议绑定 Google Authenticator" : "Bind Google Authenticator recommended"
          }
          status={totpEnabled ? (isZh ? "已启用" : "Enabled") : isZh ? "未设置" : "Not set"}
          statusOk={totpEnabled}
          action={totpEnabled ? (isZh ? "关闭" : "Disable") : isZh ? "设置" : "Set up"}
          onAction={() => (totpEnabled ? void disable2fa() : void start2fa())}
        />
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted" />
            <h2 className="font-medium">
              {isZh ? "活跃设备" : "Active sessions"}
            </h2>
          </div>
          {sessions.length > 0 && (
            <button
              type="button"
              className="text-xs text-down hover:underline"
              onClick={() =>
                void SecurityService.revokeAllSessions().then(() => {
                  setSessions([]);
                  toast.success(isZh ? "已全部踢下线" : "All sessions revoked");
                })
              }
            >
              {isZh ? "全部下线" : "Revoke all"}
            </button>
          )}
        </div>
        <ul className="mb-6 divide-y divide-border/60">
          {sessions.length === 0 ? (
            <li className="py-4 text-center text-sm text-muted">{t("common.noData")}</li>
          ) : (
            sessions.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p>{row.device}</p>
                  <p className="text-xs text-muted">{row.ip}</p>
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-xs text-muted">
                    {formatDateTime(row.ts, locale)}
                  </time>
                  <button
                    type="button"
                    className="text-xs text-down hover:underline"
                    onClick={() => void revokeSession(row.id)}
                  >
                    {isZh ? "踢下线" : "Revoke"}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted" />
          <h2 className="font-medium">{t("user.loginHistory")}</h2>
        </div>
        <ul className="divide-y divide-border/60">
          {logins.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">{t("common.noData")}</li>
          ) : (
            logins.map((row, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p>{row.device}</p>
                  <p className="text-xs text-muted">{row.ip}</p>
                </div>
                <time className="text-xs text-muted">
                  {formatDateTime(row.ts, locale)}
                </time>
              </li>
            ))
          )}
        </ul>
      </section>

      {pwdOpen && (
        <Modal title={t("user.changePassword")} onClose={() => setPwdOpen(false)}>
          <div className="space-y-3">
            <input
              type="password"
              placeholder={isZh ? "当前密码" : "Current password"}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder={isZh ? "新密码" : "New password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder={isZh ? "确认新密码" : "Confirm password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void submitPassword()}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white"
            >
              {isZh ? "确认修改" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}

      {totpOpen && (
        <Modal title={isZh ? "绑定 Google Authenticator" : "Bind Google Authenticator"} onClose={() => setTotpOpen(false)}>
          <div className="space-y-3 text-sm">
            <p className="text-muted break-all font-mono text-xs">{totpSecret}</p>
            <a href={totpUrl} className="text-xs text-primary break-all">{totpUrl}</a>
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder={isZh ? "6 位验证码" : "6-digit code"}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
            <button
              type="button"
              onClick={() => void confirm2fa()}
              className="w-full rounded-lg bg-primary py-2 font-medium text-white"
            >
              {isZh ? "验证并启用" : "Verify & enable"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  desc,
  status,
  statusOk,
  action,
  onAction,
}: {
  icon: typeof KeyRound;
  title: string;
  desc: string;
  status: string;
  statusOk?: boolean;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-5 py-4 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{desc}</p>
        <p className={`mt-1 text-xs ${statusOk ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
          {status}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-surface-muted"
      >
        {action}
      </button>
    </div>
  );
}
