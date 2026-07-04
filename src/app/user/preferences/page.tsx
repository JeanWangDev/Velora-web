"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ChevronRight, Shield } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import {
  useLocale,
  useSetLocale,
} from "@/i18n/use-translation";
import type { Locale } from "@/i18n/dictionaries";
import {
  usePreferencesStore,
  type RiseFallMode,
  type TimezonePref,
} from "@/stores/use-preferences-store";

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
];

const THEMES = [
  { value: "light", labelZh: "浅色", labelEn: "Light" },
  { value: "dark", labelZh: "深色", labelEn: "Dark" },
  { value: "system", labelZh: "跟随系统", labelEn: "System" },
] as const;

const TIMEZONES: Array<{ value: TimezonePref; labelZh: string; labelEn: string }> = [
  { value: "local", labelZh: "本地时区", labelEn: "Local" },
  { value: "utc8", labelZh: "UTC+8", labelEn: "UTC+8" },
  { value: "utc", labelZh: "UTC", labelEn: "UTC" },
];

export default function UserPreferencesPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const riseFall = usePreferencesStore((s) => s.riseFall);
  const timezone = usePreferencesStore((s) => s.timezone);
  const setRiseFall = usePreferencesStore((s) => s.setRiseFall);
  const setTimezone = usePreferencesStore((s) => s.setTimezone);

  useEffect(() => setMounted(true), []);

  return (
    <div className="aurora-bg mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("user.preferences")}
      </h1>

      <div className="space-y-4">
        <PrefSection title={t("user.language")}>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <Chip
                key={l.code}
                active={locale === l.code}
                onClick={() => setLocale(l.code)}
              >
                {l.label}
              </Chip>
            ))}
          </div>
        </PrefSection>

        <PrefSection title={t("user.theme")}>
          {mounted && (
            <div className="flex flex-wrap gap-2">
              {THEMES.map((th) => (
                <Chip
                  key={th.value}
                  active={theme === th.value}
                  onClick={() => setTheme(th.value)}
                >
                  {locale === "zh" ? th.labelZh : th.labelEn}
                </Chip>
              ))}
            </div>
          )}
        </PrefSection>

        <PrefSection title={t("user.riseFall")}>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={riseFall === "intl"}
              onClick={() => setRiseFall("intl" as RiseFallMode)}
            >
              {t("user.riseIntl")}
            </Chip>
            <Chip
              active={riseFall === "cn"}
              onClick={() => setRiseFall("cn" as RiseFallMode)}
            >
              {t("user.riseCn")}
            </Chip>
          </div>
        </PrefSection>

        <PrefSection title={t("user.timezone")}>
          <div className="flex flex-wrap gap-2">
            {TIMEZONES.map((tz) => (
              <Chip
                key={tz.value}
                active={timezone === tz.value}
                onClick={() => setTimezone(tz.value)}
              >
                {locale === "zh" ? tz.labelZh : tz.labelEn}
              </Chip>
            ))}
          </div>
        </PrefSection>

        <Link
          href="/user/security"
          className="glass-panel flex items-center justify-between rounded-2xl p-5 transition hover:border-primary/30"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">{t("user.security")}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>
      </div>
    </div>
  );
}

function PrefSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-2xl p-5">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm transition ${
        active
          ? "bg-primary/15 font-medium text-primary"
          : "bg-surface-muted text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
