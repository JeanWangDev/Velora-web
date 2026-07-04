"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Download,
  HelpCircle,
  MessageSquare,
  Search,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useTranslation, type TranslationKey } from "@/i18n/use-translation";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { VeloraLogo } from "@/components/ui/velora-logo";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterKycModal } from "@/components/auth/register-kyc-modal";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { AuthHydrator } from "@/components/auth/auth-hydrator";
import { TradeModeNav } from "@/components/exchange/okx/trade-mode-nav";
import { AssetsDropdown } from "@/components/exchange/terminal/assets-dropdown";
import { NotificationsDropdown } from "@/components/exchange/terminal/notifications-dropdown";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/use-auth-store";
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
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isTerminal =
    pathname.startsWith("/trade") || pathname.startsWith("/futures");

  return (
    <>
      <AuthHydrator />
      <header
        className={cn(
          "sticky top-0 z-50 border-b",
          isTerminal
            ? "border-[#1f1f1f] bg-[#000000]"
            : "border-border bg-surface",
        )}
      >
        <div className="flex h-12 items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <VeloraLogo showWordmark className="h-7 w-auto" />
          </Link>

          <div
            className={cn(
              "hidden h-5 w-px md:block",
              isTerminal ? "bg-[#2a2a2a]" : "bg-border",
            )}
          />

          {/* Center nav — OKX style */}
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((item) => {
              if (item.dropdown && item.labelKey === "nav.trade") {
                return <TradeModeNav key={item.href} />;
              }
              const active =
                item.labelKey === "nav.trade"
                  ? pathname.startsWith("/trade") ||
                    pathname.startsWith("/futures")
                  : pathname.startsWith(item.href);
              return (
                <Link
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
                </Link>
              );
            })}
          </nav>

          {/* Right utilities */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={et("markets.search")}
                className={cn(
                  "w-40 rounded-full py-1.5 pl-8 pr-3 text-xs outline-none xl:w-48",
                  isTerminal
                    ? "border border-[var(--terminal-border)] bg-[#141414] text-foreground placeholder:text-muted"
                    : "border border-border bg-surface-muted",
                )}
              />
            </div>

            <Link
              href="/assets"
              className={cn(
                "hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex",
                isTerminal
                  ? "border-[var(--terminal-border)] text-foreground hover:bg-[#141414]"
                  : "border-border hover:border-accent/40",
              )}
            >
              {et("trade.deposit")}
            </Link>

            <AssetsDropdown />

            {!hydrated ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-surface-muted" />
            ) : user ? (
              <UserAccountMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="text-xs text-muted transition hover:text-foreground"
                >
                  {t("site.login")}
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    isTerminal
                      ? "border-white/40 text-foreground hover:bg-[#141414]"
                      : "border-border hover:border-accent/40",
                  )}
                >
                  {t("site.register")}
                </button>
              </div>
            )}

            <div
              className={cn(
                "hidden h-5 w-px lg:block",
                isTerminal ? "bg-[#2a2a2a]" : "bg-border",
              )}
            />

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
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onGoRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterKycModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onGoLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
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
      className="rounded p-2 text-muted transition hover:bg-[#141414] hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
