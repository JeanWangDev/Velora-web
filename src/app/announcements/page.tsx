"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { MOCK_ANNOUNCEMENTS } from "@/mocks/exchange-data";
import { formatDateTime } from "@/utils/format-exchange";
import { isChineseLocale } from "@/i18n/locale-helpers";

type Cat = "all" | "maintenance" | "listing" | "risk";

export default function AnnouncementsPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [cat, setCat] = useState<Cat>("all");

  const tabs: { key: Cat; label: string }[] = [
    { key: "all", label: t("announcements.all") },
    { key: "listing", label: t("announcements.listing") },
    { key: "maintenance", label: t("announcements.maintenance") },
    { key: "risk", label: t("announcements.risk") },
  ];

  const rows = useMemo(() => {
    const sorted = [...MOCK_ANNOUNCEMENTS].sort(
      (a, b) => b.publishedAt - a.publishedAt,
    );
    if (cat === "all") return sorted;
    return sorted.filter((a) => a.category === cat);
  }, [cat]);

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

      <div className="space-y-3">
        {rows.map((ann) => (
          <Link
            key={ann.id}
            href={`/announcements/${ann.id}`}
            className="glass-panel block rounded-2xl p-5 transition hover:border-primary/30"
          >
            <div className="mb-2 flex items-center gap-2">
              <CategoryBadge category={ann.category} t={t} />
              <time className="text-xs text-muted">
                {formatDateTime(ann.publishedAt, locale)}
              </time>
            </div>
            <h2 className="font-medium">
              {isChineseLocale(locale) ? ann.titleZh : ann.titleEn}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {isChineseLocale(locale) ? ann.summaryZh : ann.summaryEn}
            </p>
            <span className="mt-3 inline-block text-sm text-primary">
              {t("announcements.readMore")} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CategoryBadge({
  category,
  t,
}: {
  category: string;
  t: (k: string) => string;
}) {
  const colors: Record<string, string> = {
    listing: "bg-accent/15 text-accent",
    maintenance: "bg-primary/15 text-primary",
    risk: "bg-down/15 text-down",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${colors[category] ?? "bg-surface-muted text-muted"}`}
    >
      {t(`announcements.${category}`)}
    </span>
  );
}
