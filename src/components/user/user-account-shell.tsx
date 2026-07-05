"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocaleLink } from "@/components/ui/locale-link";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocaleHref } from "@/i18n/locale-path";
import { toast } from "@/services/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useKycStore } from "@/stores/use-kyc-store";
import { stripLocaleFromPath } from "@/i18n/locales";
import {
  USER_ACCOUNT_NAV,
  isUserAccountNavActive,
} from "@/config/user-account-nav";
import { cn } from "@/lib/cn";

function kycBadgeLabel(
  status: ReturnType<typeof useKycStore.getState>["status"],
  t: (key: string) => string,
): string | null {
  if (status === "verified") return t("user.kycStatusVerified");
  if (status === "pending") return t("user.kycStatusPending");
  if (status === "rejected") return t("user.kycStatusRejected");
  return t("user.kycStatusNone");
}

function kycBadgeClass(status: ReturnType<typeof useKycStore.getState>["status"]) {
  if (status === "verified")
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (status === "pending")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (status === "rejected")
    return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  return "bg-surface-muted text-muted";
}

export function UserAccountShell({ children }: { children: React.ReactNode }) {
  const t = useExchangeT();
  const pathname = usePathname();
  const barePath = stripLocaleFromPath(pathname);
  const router = useRouter();
  const localeHref = useLocaleHref();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const kycStatus = useKycStore((s) => s.status);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      toast.info(t("user.kycLoginRequired"));
      router.replace(localeHref("/login"));
    }
  }, [hydrated, user, router, localeHref, t]);

  if (!hydrated || !user) {
    return (
      <div className="aurora-bg flex min-h-[50vh] items-center justify-center text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="aurora-bg min-h-[calc(100vh-4rem)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <aside className="shrink-0 lg:w-52">
          <p className="mb-3 hidden text-xs font-medium uppercase tracking-wider text-muted lg:block">
            {t("user.accountCenter")}
          </p>
          <nav
            className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            aria-label={t("user.accountCenter")}
          >
            {USER_ACCOUNT_NAV.map((item) => {
              const active = isUserAccountNavActive(barePath, item);
              const Icon = item.icon;
              const badge =
                item.showKycBadge ? kycBadgeLabel(kycStatus, t) : null;

              return (
                <LocaleLink
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-surface font-medium text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted hover:bg-surface/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted",
                    )}
                  />
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                  {badge ? (
                    <span
                      className={cn(
                        "ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] font-medium lg:inline",
                        kycBadgeClass(kycStatus),
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </LocaleLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
