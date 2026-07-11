"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale } from "@/i18n/use-translation";
import { MOCK_ANNOUNCEMENTS } from "@/mocks/exchange-data";
import { NotificationService, type UserNotification } from "@/services/notification-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatDateTime } from "@/utils/format-exchange";

export function NotificationsDropdown() {
  const t = useExchangeT();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const mounted = useHydrated();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const announcements = [...MOCK_ANNOUNCEMENTS]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 3);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await NotificationService.list(1, 10);
      setNotifications(res.rows ?? []);
      setUnread(res.unread ?? 0);
    } catch {
      /* 静默 */
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!user) return;
    void loadNotifications();
    const timer = setInterval(() => {
      if (!useAuthStore.getState().user) return;
      void loadNotifications();
    }, 30_000);
    return () => clearInterval(timer);
  }, [user, loadNotifications]);

  const markRead = async (id: number) => {
    try {
      await NotificationService.markRead([id]);
      setUnread((u) => Math.max(0, u - 1));
      setNotifications((list) =>
        list.map((n) => (n.id === id ? { ...n, read: 1 } : n)),
      );
    } catch {
      /* 静默 */
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative rounded-md p-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
        aria-label={t("announcements.title")}
      >
        <Bell className="h-4 w-4" />
        {(unread > 0 || !user) && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-down" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">
              {user ? "通知中心" : t("announcements.title")}
            </span>
            <Link
              href="/announcements"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {t("announcements.all")}
            </Link>
          </div>

          {user && notifications.length > 0 && (
            <>
              <ul className="max-h-48 overflow-y-auto border-b border-border">
                {notifications.map((n) => (
                  <li key={n.id} className="border-b border-border/60 last:border-0">
                    <button
                      type="button"
                      className="block w-full px-3 py-2.5 text-left transition hover:bg-surface-muted"
                      onClick={() => void markRead(n.id)}
                    >
                      <p
                        className={`text-xs font-medium line-clamp-1 ${
                          n.read ? "text-muted" : "text-foreground"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{n.body}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-muted">
                        {mounted ? formatDateTime(n.ts, locale) : "--"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted">
            {t("announcements.title")}
          </div>
          <ul className="max-h-40 overflow-y-auto">
            {announcements.map((ann) => (
              <li key={ann.id} className="border-b border-border/60 last:border-0">
                <Link
                  href={`/announcements/${ann.id}`}
                  className="block px-3 py-2 transition hover:bg-surface-muted"
                  onClick={() => setOpen(false)}
                >
                  <p className="text-xs font-medium line-clamp-1">
                    {locale === "zh" ? ann.titleZh : ann.titleEn}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {mounted ? formatDateTime(ann.publishedAt, locale) : "--"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
