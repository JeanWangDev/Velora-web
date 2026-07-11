"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocaleLink } from "@/components/ui/locale-link";
import { SidebarShellLayout } from "@/components/layout/sidebar-shell-layout";
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

function UserAccountNav() {
  const t = useExchangeT();
  const pathname = usePathname();
  const barePath = stripLocaleFromPath(pathname);
  const kycStatus = useKycStore((s) => s.status);

  return (
    <nav
      className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible"
      aria-label={t("user.accountCenter")}
    >
      {USER_ACCOUNT_NAV.map((item) => {
        const active = isUserAccountNavActive(barePath, item);
        const Icon = item.icon;
        const badge = item.showKycBadge ? kycBadgeLabel(kycStatus, t) : null;

        return (
          <LocaleLink
            key={item.id}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition lg:w-full",
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted")} />
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
  );
}

export function UserAccountShell({ children }: { children: React.ReactNode }) {
  const t = useExchangeT();
  const router = useRouter();
  const localeHref = useLocaleHref();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      toast.info(t("user.kycLoginRequired"));
      router.replace(localeHref("/login"));
    }
  }, [hydrated, user, router, localeHref, t]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <SidebarShellLayout
      sidebarTitle={t("user.accountCenter")}
      sidebar={<UserAccountNav />}
      mainClassName="aurora-bg"
    >
      {children}
    </SidebarShellLayout>
  );
}
