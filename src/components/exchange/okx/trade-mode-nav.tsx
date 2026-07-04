"use client";

import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useTranslation } from "@/i18n/use-translation";
import { LocaleLink } from "@/components/ui/locale-link";
import { stripLocaleFromPath } from "@/i18n/locales";
import { cn } from "@/lib/cn";

export function TradeModeNav() {
  const t = useExchangeT();
  const tSite = useTranslation();
  const pathname = usePathname();
  const bare = stripLocaleFromPath(pathname);
  const isFutures = bare.startsWith("/futures");
  const isTrade = bare.startsWith("/trade") || isFutures;

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-0.5 rounded px-3 py-2 text-sm transition",
          isTrade
            ? "font-medium text-foreground"
            : "text-muted hover:text-foreground",
        )}
      >
        {tSite("nav.trade")}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      <div className="invisible absolute left-0 top-full z-50 mt-0 w-72 rounded-lg border border-border bg-surface p-3 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">
          {t("trade.tradeTypes")}
        </p>
        <div className="space-y-1">
          <ModeLink
            href="/trade/BTC-USDT"
            title={t("trade.spot")}
            desc={t("trade.spotDesc")}
            active={!isFutures && bare.startsWith("/trade")}
          />
          <ModeLink
            href="/futures/BTC-USDT"
            title={t("trade.futures")}
            desc={t("trade.futuresDesc")}
            active={isFutures}
          />
        </div>
        <p className="mb-2 mt-3 text-[10px] font-medium uppercase tracking-wide text-muted">
          {t("trade.tools")}
        </p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <LocaleLink
            href="/markets"
            className="rounded-lg px-2 py-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            {t("markets.title")}
          </LocaleLink>
          <LocaleLink
            href="/orders"
            className="rounded-lg px-2 py-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            {t("orders.title")}
          </LocaleLink>
        </div>
      </div>
    </div>
  );
}

function ModeLink({
  href,
  title,
  desc,
  active,
}: {
  href: string;
  title: string;
  desc: string;
  active: boolean;
}) {
  return (
    <LocaleLink
      href={href}
      className={cn(
        "block rounded-lg px-3 py-2 transition",
        active
          ? "bg-surface-muted text-foreground"
          : "hover:bg-surface-muted",
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-[11px] text-muted">{desc}</p>
    </LocaleLink>
  );
}
