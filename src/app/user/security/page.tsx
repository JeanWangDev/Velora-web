"use client";

import Link from "next/link";
import { ChevronLeft, KeyRound, Shield, Smartphone } from "lucide-react";
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

  return (
    <div className="aurora-bg mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/user/preferences"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("user.preferences")}
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("user.security")}
      </h1>

      <div className="space-y-4">
        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium">{t("user.changePassword")}</h2>
              <p className="mt-1 text-sm text-muted">
                {locale === "zh"
                  ? "定期更新密码可提升账户安全（演示页，后端接入后生效）。"
                  : "Update your password regularly (demo — backend pending)."}
              </p>
              <button
                type="button"
                className="mt-3 rounded-full bg-primary/15 px-4 py-1.5 text-sm text-primary hover:bg-primary/25"
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium">{t("user.twoFa")}</h2>
              <p className="mt-1 text-sm text-muted">
                {locale === "zh"
                  ? "未启用 — 建议绑定 Google Authenticator。"
                  : "Not enabled — bind Google Authenticator recommended."}
              </p>
              <span className="mt-3 inline-block rounded-full bg-surface-muted px-3 py-1 text-xs text-muted">
                {locale === "zh" ? "即将开放" : "Coming soon"}
              </span>
            </div>
          </div>
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
    </div>
  );
}
