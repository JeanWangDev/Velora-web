"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { MOCK_ANNOUNCEMENTS } from "@/mocks/exchange-data";
import { formatDateTime } from "@/utils/format-exchange";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useExchangeT();
  const locale = useLocale();
  const ann = MOCK_ANNOUNCEMENTS.find((a) => a.id === id);

  if (!ann) notFound();

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
          {locale === "zh" ? ann.titleZh : ann.titleEn}
        </h1>
        <div className="prose prose-sm mt-6 max-w-none text-foreground/90 dark:prose-invert">
          <p>{locale === "zh" ? ann.contentZh : ann.contentEn}</p>
        </div>
      </article>
    </div>
  );
}
