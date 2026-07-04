"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Coins, LogOut, Settings, Shield, UserCog, Users } from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { ProfileModal } from "@/components/auth/profile-modal";
import { AppModal } from "@/components/ui/app-modal";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { AuthUser } from "@/types/auth";
import { isAdminUser } from "@/utils/admin";

interface UserAccountMenuProps {
  user: AuthUser;
}

export function UserAccountMenu({ user }: UserAccountMenuProps) {
  const t = useTranslation();
  const logout = useAuthStore((state) => state.logout);

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
            className="absolute right-0 z-50 mt-1 min-w-[168px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted"
            >
              <UserCog className="h-3.5 w-3.5 text-muted" />
              {t("site.editProfile")}
            </button>
            <Link
              href="/user/preferences"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted"
            >
              <Settings className="h-3.5 w-3.5 text-muted" />
              {t("exchange.user.preferences")}
            </Link>
            <Link
              href="/user/security"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted"
            >
              <Shield className="h-3.5 w-3.5 text-muted" />
              {t("exchange.user.security")}
            </Link>
            {isAdminUser(user) ? (
              <>
                <Link
                  href="/admin/symbols"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted"
                >
                  <Coins className="h-3.5 w-3.5 text-muted" />
                  {t("site.adminSymbols")}
                </Link>
                <Link
                  href="/admin/users"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-surface-muted"
                >
                  <Users className="h-3.5 w-3.5 text-muted" />
                  {t("site.adminUsers")}
                </Link>
              </>
            ) : null}
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
