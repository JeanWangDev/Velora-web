"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Download,
  HelpCircle,
  MessageSquare,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useTranslation, type TranslationKey } from "@/i18n/use-translation";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { VeloraLogo } from "@/components/ui/velora-logo";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { TradeModeNav } from "@/components/exchange/okx/trade-mode-nav";
import { AssetsDropdown } from "@/components/exchange/terminal/assets-dropdown";
import { NotificationsDropdown } from "@/components/exchange/terminal/notifications-dropdown";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleLink } from "@/components/ui/locale-link";
import { useAuthStore } from "@/stores/use-auth-store";
import { stripLocaleFromPath } from "@/i18n/locales";
import { cn } from "@/lib/cn";

const NAV: { href: string; labelKey: TranslationKey; dropdown?: boolean }[] = [
  { href: "/markets", labelKey: "nav.markets" },
  { href: "/trade/BTC-USDT", labelKey: "nav.trade", dropdown: true },
  { href: "/assets", labelKey: "nav.assets", dropdown: true },
  { href: "/orders", labelKey: "nav.orders" },
];

export function SiteHeader() {
  const t = useTranslation();
  const et = useExchangeT();
  const pathname = usePathname();
  const barePath = stripLocaleFromPath(pathname);
  const [searchQ, setSearchQ] = useState("");
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isTerminal =
    barePath.startsWith("/trade") || barePath.startsWith("/futures");
  return (
    <>
      <AuthHydrator />
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border bg-background",
          isTerminal && "bg-[var(--terminal-bg)]",
        )}
      >
        <div className="flex h-12 items-center gap-4 px-4">
          <LocaleLink href="/" className="flex shrink-0 items-center gap-2">
            <VeloraLogo showWordmark className="h-7 w-auto" />
          </LocaleLink>

          <div className="hidden h-5 w-px bg-border md:block" />

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((item) => {
              if (item.dropdown && item.labelKey === "nav.trade") {
                return <TradeModeNav key={item.href} />;
              }
              const active =
                item.labelKey === "nav.trade"
                  ? barePath.startsWith("/trade") ||
                    barePath.startsWith("/futures")
                  : barePath.startsWith(item.href);
              return (
                <LocaleLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded px-3 py-2 text-sm transition",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                  {item.dropdown && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  )}
                </LocaleLink>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={et("markets.search")}
                className="w-40 rounded-full border border-border bg-surface-muted py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-muted xl:w-48"
              />
            </div>

            <LocaleLink
              href="/assets"
              className="hidden rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted sm:inline-flex"
            >
              {et("trade.deposit")}
            </LocaleLink>

            <AssetsDropdown />

            {!hydrated ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-surface-muted" />
            ) : user ? (
              <UserAccountMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <LocaleLink
                  href="/login"
                  className="text-xs text-muted transition hover:text-foreground"
                >
                  {t("site.login")}
                </LocaleLink>
                <LocaleLink
                  href="/register"
                  className="btn-cta inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  {t("site.register")}
                </LocaleLink>
              </div>
            )}

            <div className="hidden h-5 w-px bg-border lg:block" />

            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-1 lg:flex">
                <HeaderIconBtn icon={Download} label="Download" />
                <HeaderIconBtn icon={MessageSquare} label="Messages" />
                <NotificationsDropdown />
                <HeaderIconBtn icon={HelpCircle} label="Help" />
              </div>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function HeaderIconBtn({
  icon: Icon,
  label,
}: {
  icon: typeof Bell;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded p-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
