"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import {
  AnnouncementService,
  type Announcement,
} from "@/services/announcement-service";
import { formatDateTime } from "@/utils/format-exchange";
import { isChineseLocale } from "@/i18n/locale-helpers";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const t = useExchangeT();
  const locale = useLocale();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void AnnouncementService.getById(id)
      .then(setAnn)
      .catch(() => setAnn(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!loading && !ann) notFound();
  if (!ann) {
    return (
      <div className="aurora-bg mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">
        {loading ? t("common.loading") : t("common.noData")}
      </div>
    );
  }

  return (
    <div className="aurora-bg mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/announcements"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("announcements.title")}
      </Link>

      <article className="glass-panel rounded-2xl p-6 sm:p-8">
        <p className="text-xs text-muted">
          {formatDateTime(ann.publishedAt, locale)} ·{" "}
          {t(`announcements.${ann.category}`)}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {isChineseLocale(locale) ? ann.titleZh : ann.titleEn}
        </h1>
        <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-foreground/90 dark:prose-invert">
          <p>{isChineseLocale(locale) ? ann.contentZh : ann.contentEn}</p>
        </div>
      </article>
    </div>
  );
}
