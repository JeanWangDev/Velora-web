"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  Coins,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { ProfileModal } from "@/components/auth/profile-modal";
import { AppModal } from "@/components/ui/app-modal";
import { LocaleLink } from "@/components/ui/locale-link";
import { useAuthStore } from "@/stores/use-auth-store";
import { useKycStore } from "@/stores/use-kyc-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import { maskEmail } from "@/utils/mask-email";
import type { AuthUser } from "@/types/auth";
import { isAdminUser } from "@/utils/admin";
import { cn } from "@/lib/cn";

interface UserAccountMenuProps {
  user: AuthUser;
}

function kycBadgeText(
  status: ReturnType<typeof useKycStore.getState>["status"],
  t: ReturnType<typeof useTranslation>,
) {
  if (status === "verified") return t("exchange.user.kycStatusVerified");
  if (status === "pending") return t("exchange.user.kycStatusPending");
  if (status === "rejected") return t("exchange.user.kycStatusRejected");
  return t("exchange.user.kycStatusNone");
}

function kycBadgeClass(status: ReturnType<typeof useKycStore.getState>["status"]) {
  if (status === "verified")
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (status === "pending")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (status === "rejected")
    return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
}

const menuLinkClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted";

export function UserAccountMenu({ user }: UserAccountMenuProps) {
  const t = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const kycStatus = useKycStore((state) => state.status);

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onClick = () => setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  function handleLogoutConfirm() {
    setLogoutOpen(false);
    setOpen(false);
    logout();
    toast.success(t("site.logoutSuccess"));
  }

  const kycLabel = kycBadgeText(kycStatus, t);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          title={user.nickname}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("site.accountMenu")}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          className="inline-flex max-w-[200px] items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2 text-foreground transition hover:border-accent/40 hover:text-accent"
        >
          <UserAvatar nickname={user.nickname} />
          <span className="hidden truncate text-xs font-medium sm:inline">
            {user.nickname}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            {/* 用户信息头 */}
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-xs font-medium">{maskEmail(user.email)}</p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  kycBadgeClass(kycStatus),
                )}
              >
                {kycLabel}
              </span>
            </div>

            {/* 账户中心 */}
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted">
                {t("exchange.user.accountCenter")}
              </p>
              <LocaleLink
                href="/user"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuLinkClass}
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-muted" />
                {t("exchange.user.overview")}
              </LocaleLink>
              <LocaleLink
                href="/user/kyc"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuLinkClass}
              >
                <BadgeCheck className="h-3.5 w-3.5 text-muted" />
                <span className="flex-1">{t("exchange.user.kyc")}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    kycBadgeClass(kycStatus),
                  )}
                >
                  {kycLabel}
                </span>
              </LocaleLink>
              <LocaleLink
                href="/user/security"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuLinkClass}
              >
                <Shield className="h-3.5 w-3.5 text-muted" />
                {t("exchange.user.security")}
              </LocaleLink>
              <LocaleLink
                href="/user/preferences"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuLinkClass}
              >
                <Settings className="h-3.5 w-3.5 text-muted" />
                {t("exchange.user.preferences")}
              </LocaleLink>
            </div>

            <div className="border-t border-border py-1">
              <LocaleLink
                href="/assets"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={menuLinkClass}
              >
                <Wallet className="h-3.5 w-3.5 text-muted" />
                {t("exchange.assets.title")}
              </LocaleLink>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setProfileOpen(true);
                }}
                className={menuLinkClass}
              >
                <UserCog className="h-3.5 w-3.5 text-muted" />
                {t("site.editProfile")}
              </button>
            </div>

            {isAdminUser(user) ? (
              <div className="border-t border-border py-1">
                <Link
                  href="/admin/symbols"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuLinkClass}
                >
                  <Coins className="h-3.5 w-3.5 text-muted" />
                  {t("site.adminSymbols")}
                </Link>
                <Link
                  href="/admin/users"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={menuLinkClass}
                >
                  <Users className="h-3.5 w-3.5 text-muted" />
                  {t("site.adminUsers")}
                </Link>
              </div>
            ) : null}

            <div className="border-t border-border py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setLogoutOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-surface-muted dark:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("site.logout")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ProfileModal
        key={profileOpen ? `${user.id}-${user.nickname}` : "closed"}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <AppModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title={t("logoutModal.title")}
        panelClassName="max-w-sm"
      >
        <p className="mb-5 text-sm text-muted">{t("logoutModal.message")}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setLogoutOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:border-accent/40"
          >
            {t("logoutModal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleLogoutConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {t("logoutModal.confirm")}
          </button>
        </div>
      </AppModal>
    </>
  );
}
