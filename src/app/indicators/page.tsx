"use client";

import { useDict, useTranslation } from "@/i18n/use-translation";
import { INDICATOR_CATEGORY_ICONS } from "@/app/indicators/_config/category-icons";

export default function IndicatorsPage() {
  const t = useTranslation();
  const dict = useDict();
  const categories = dict.indicators.categories;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          {t("indicators.title")}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
          {t("indicators.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(
          Object.entries(categories) as Array<
            [keyof typeof categories, string]
          >
        ).map(([key, label]) => {
          const Icon = INDICATOR_CATEGORY_ICONS[key];
          return (
            <div
              key={key}
              className="group rounded-3xl border border-border bg-surface p-6 transition hover:border-accent/40"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {label}
              </h3>
              <p className="mt-2 text-sm text-muted">— indicators</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">{t("indicators.empty")}</p>
    </section>
  );
}
