"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import {
  AnnouncementService,
  type Announcement,
  type AnnouncementCategory,
} from "@/services/announcement-service";
import { formatDateTime } from "@/utils/format-exchange";
import { isChineseLocale } from "@/i18n/locale-helpers";

type Cat = AnnouncementCategory;

export default function AnnouncementsPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [cat, setCat] = useState<Cat>("all");
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs: { key: Cat; label: string }[] = [
    { key: "all", label: t("announcements.all") },
    { key: "listing", label: t("announcements.listing") },
    { key: "maintenance", label: t("announcements.maintenance") },
    { key: "risk", label: t("announcements.risk") },
  ];

  useEffect(() => {
    setLoading(true);
    void AnnouncementService.list(cat)
      .then((res) => setRows(res.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [cat]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.publishedAt - a.publishedAt),
    [rows],
  );

  return (
    <div className="aurora-bg mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("announcements.title")}
      </h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setCat(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              cat === item.key
                ? "bg-primary/15 text-primary"
                : "text-muted hover:bg-surface-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">{t("common.loading")}</p>
      ) : sorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">{t("common.noData")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {sorted.map((ann) => (
            <li key={ann.id}>
              <Link
                href={`/announcements/${ann.id}`}
                className="block px-5 py-4 transition hover:bg-surface-muted"
              >
                <p className="font-medium">
                  {isChineseLocale(locale) ? ann.titleZh : ann.titleEn}
                </p>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {isChineseLocale(locale) ? ann.summaryZh : ann.summaryEn}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {formatDateTime(ann.publishedAt, locale)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
