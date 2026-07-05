"use client";

import { KeyRound, Shield, Smartphone } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { formatDateTime } from "@/utils/format-exchange";

const MOCK_LOGINS = [
  { ip: "183.**.**.42", device: "Chrome · macOS", ts: Date.now() - 3_600_000 },
  { ip: "120.**.**.18", device: "Safari · iOS", ts: Date.now() - 86_400_000 },
  { ip: "47.**.**.91", device: "Velora App", ts: Date.now() - 604_800_000 },
];

export default function UserSecurityPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = locale === "zh";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("user.security")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("user.securityHint")}</p>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-medium">
            {isZh ? "两步验证 (2FA)" : "Two-factor authentication (2FA)"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {isZh
              ? "建议至少启用一种验证方式"
              : "Enable at least one verification method"}
          </p>
        </div>

        <SecurityRow
          icon={KeyRound}
          title={t("user.changePassword")}
          desc={
            isZh
              ? "定期更新密码可提升账户安全（演示页，后端接入后生效）"
              : "Update your password regularly (demo — backend pending)"
          }
          status={isZh ? "已设置" : "Set"}
          statusOk
          action={isZh ? "修改" : "Change"}
        />
        <SecurityRow
          icon={Smartphone}
          title={t("user.twoFa")}
          desc={
            isZh
              ? "未启用 — 建议绑定 Google Authenticator"
              : "Not enabled — bind Google Authenticator recommended"
          }
          status={isZh ? "未设置" : "Not set"}
          action={isZh ? "设置" : "Set up"}
        />
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted" />
          <h2 className="font-medium">{t("user.loginHistory")}</h2>
        </div>
        <ul className="divide-y divide-border/60">
          {MOCK_LOGINS.map((row, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p>{row.device}</p>
                <p className="text-xs text-muted">{row.ip}</p>
              </div>
              <time className="text-xs text-muted">
                {formatDateTime(row.ts, locale)}
              </time>
            </li>
          ))}
        </ul>
      </section>
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
}: {
  icon: typeof KeyRound;
  title: string;
  desc: string;
  status: string;
  statusOk?: boolean;
  action: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-5 py-4 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{desc}</p>
        <p
          className={`mt-1 text-xs ${statusOk ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}
        >
          {status}
        </p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-lg border border-border bg-surface px-4 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:text-primary"
      >
        {action}
      </button>
    </div>
  );
}
