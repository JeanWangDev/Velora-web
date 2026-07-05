"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale } from "@/i18n/use-translation";
import { MOCK_ANNOUNCEMENTS } from "@/mocks/exchange-data";
import { formatDateTime } from "@/utils/format-exchange";

export function NotificationsDropdown() {
  const t = useExchangeT();
  const locale = useLocale();
  // 公告的 mock 时间戳基于模块加载时的 Date.now() 计算，服务端渲染与客户端
  // 挂载时刻不同会导致格式化文案不一致，挂载前先用稳定占位符。
  const mounted = useHydrated();
  const [open, setOpen] = useState(false);
  const items = [...MOCK_ANNOUNCEMENTS]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

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
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-down" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">{t("announcements.title")}</span>
            <Link
              href="/announcements"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {t("announcements.all")}
            </Link>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.map((ann) => (
              <li key={ann.id} className="border-b border-border/60 last:border-0">
                <Link
                  href={`/announcements/${ann.id}`}
                  className="block px-3 py-2.5 transition hover:bg-surface-muted"
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
