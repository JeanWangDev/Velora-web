"use client";

import { useState } from "react";
import {
  Apple,
  ChevronDown,
  ChevronRight,
  QrCode,
  Shield,
  Sparkles,
  Zap,
  Percent,
} from "lucide-react";
import { LocaleLink } from "@/components/ui/locale-link";
import { useTranslation } from "@/i18n/use-translation";
import { useAuthStore } from "@/stores/use-auth-store";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { displayPair, formatPrice } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";
import { PriceChange } from "@/components/exchange/price-change";
import { CoinIcon } from "@/components/exchange/coin-icon";
import { cn } from "@/lib/cn";

function Sparkline({ up }: { up: boolean }) {
  // 装饰性随机曲线：仅需生成一次，用 useState 惰性初始化以满足渲染纯度规则。
  const [points] = useState(() => {
    let y = 20;
    const pts: string[] = [];
    for (let i = 0; i < 16; i++) {
      y += (Math.random() - (up ? 0.42 : 0.58)) * 8;
      y = Math.max(4, Math.min(28, y));
      pts.push(`${(i / 15) * 80},${32 - y}`);
    }
    return pts.join(" ");
  });

  return (
    <svg width="80" height="32" viewBox="0 0 80 32" className="overflow-visible">
      <polyline
        fill="none"
        stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export default function HomePage() {
  const t = useTranslation();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const tickers = useMockMarketStore((s) => s.tickers);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rows = MOCK_SYMBOLS.slice(0, 6).map((s) => ({
    meta: s,
    ticker: tickers[s.symbol],
  }));

  const highlights = [
    { title: t("home.highlightFee"), icon: Percent },
    { title: t("home.highlightWithdraw"), icon: Sparkles },
    { title: t("home.highlightSecurity"), icon: Shield },
    { title: t("home.highlightSupport"), icon: Zap },
  ];

  const whyItems = [
    {
      title: t("home.featFeeTitle"),
      desc: t("home.featFeeDesc"),
      badge: "%",
      accent: "from-amber-400/20 to-amber-600/5",
    },
    {
      title: t("home.featWithdrawTitle"),
      desc: t("home.featWithdrawDesc"),
      badge: "0",
      accent: "from-emerald-400/20 to-emerald-600/5",
    },
    {
      title: t("home.featSecurityTitle"),
      desc: t("home.featSecurityDesc"),
      badge: "◎",
      accent: "from-sky-400/20 to-sky-600/5",
    },
    {
      title: t("home.featSpeedTitle"),
      desc: t("home.featSpeedDesc"),
      badge: "⚡",
      accent: "from-violet-400/20 to-violet-600/5",
    },
  ];

  const faqs = [
    { q: t("home.faq1q"), a: t("home.faq1a") },
    { q: t("home.faq2q"), a: t("home.faq2a") },
    { q: t("home.faq3q"), a: t("home.faq3a") },
    { q: t("home.faq4q"), a: t("home.faq4a") },
  ];

  const socials = ["Twitter", "Telegram", "Discord", "Medium", "LinkedIn"];

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(212,175,55,0.12),transparent_50%),radial-gradient(ellipse_at_20%_80%,rgba(108,92,231,0.08),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-3xl font-bold tracking-tight text-amber-500 sm:text-4xl lg:text-5xl">
              {t("home.heroHighlight")}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted sm:text-lg">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <LocaleLink
                  href="/trade/BTC-USDT"
                  className="btn-cta inline-flex items-center rounded-full px-8 py-3.5 text-sm font-semibold shadow-lg"
                >
                  {t("home.ctaTrade")}
                </LocaleLink>
              ) : (
                <LocaleLink
                  href="/register"
                  className="btn-cta inline-flex items-center rounded-full px-8 py-3.5 text-sm font-semibold shadow-lg"
                >
                  {t("home.ctaCreate")}
                </LocaleLink>
              )}
              <LocaleLink
                href="/markets"
                className="btn-cta-secondary inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                {t("home.ctaMarkets")}
              </LocaleLink>
            </div>
            <div className="mt-8 flex items-center gap-4 text-muted">
              <Apple className="h-5 w-5" />
              <span className="text-xs">Android</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-muted">
                <QrCode className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* 视觉：品牌大字 + 浮动币种 */}
          <div className="relative mx-auto flex h-[340px] w-full max-w-lg items-center justify-center lg:h-[400px]">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-amber-500/15 via-transparent to-violet-500/10 blur-2xl" />
            <div className="relative flex h-48 w-48 items-center justify-center rounded-[2rem] border border-border/60 bg-gradient-to-br from-surface-muted to-surface shadow-2xl backdrop-blur sm:h-56 sm:w-56">
              <span className="bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 bg-clip-text text-7xl font-black text-transparent sm:text-8xl">
                V
              </span>
            </div>
            {[
              { base: "BTC", x: "8%", y: "12%" },
              { base: "ETH", x: "78%", y: "18%" },
              { base: "SOL", x: "12%", y: "72%" },
              { base: "BNB", x: "74%", y: "68%" },
            ].map((c) => (
              <div
                key={c.base}
                className="absolute animate-pulse"
                style={{ left: c.x, top: c.y }}
              >
                <CoinIcon base={c.base} size="md" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 亮点条 */}
      <section className="border-b border-border bg-surface-muted/40">
        <div className="mx-auto grid max-w-7xl gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 热门行情表 */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">{t("home.trending")}</h2>
          <LocaleLink
            href="/markets"
            className="inline-flex items-center gap-0.5 text-sm text-muted hover:text-foreground"
          >
            {t("home.viewMore")}
            <ChevronRight className="h-4 w-4" />
          </LocaleLink>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-2 border-b border-border px-5 py-3 text-xs text-muted">
            <span>{t("home.colName")}</span>
            <span className="text-right">{t("home.colPrice")}</span>
            <span className="text-right">{t("home.colChange")}</span>
            <span className="w-20 text-right">{t("home.colChart")}</span>
          </div>
          {rows.map(({ meta, ticker }) => {
            if (!ticker) return null;
            const up = ticker.change24h >= 0;
            return (
              <LocaleLink
                key={meta.symbol}
                href={`/trade/${meta.symbol}`}
                className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-2 border-b border-border px-5 py-3.5 transition last:border-0 hover:bg-surface-muted/60"
              >
                <span className="flex items-center gap-3">
                  <CoinIcon base={meta.base} size="md" />
                  <span>
                    <span className="block text-sm font-semibold">
                      {displayPair(meta.symbol)}
                    </span>
                    <span className="text-[11px] text-muted">
                      {meta.displayName}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "text-right font-mono text-sm tabular-nums",
                    up ? "text-up" : "text-down",
                  )}
                >
                  {formatPrice(ticker.last, meta.pricePrecision, locale)}
                </span>
                <PriceChange
                  value={ticker.change24h}
                  className="justify-end text-sm"
                />
                <span className="flex w-20 justify-end">
                  <Sparkline up={up} />
                </span>
              </LocaleLink>
            );
          })}
        </div>
      </section>

      {/* Why Velora */}
      <section className="border-y border-border bg-surface-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
            {t("home.whyTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {whyItems.map((item, i) => (
              <div
                key={item.title}
                className={cn(
                  "flex items-center gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm",
                  i % 2 === 1 && "md:flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border bg-gradient-to-br text-4xl font-black text-amber-500/90",
                    item.accent,
                  )}
                >
                  {item.badge}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-xs">
          <div className="rounded-[2rem] border border-border bg-surface-muted p-3 shadow-2xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">BTC/USDT</p>
                <p className="font-mono text-xl font-semibold text-up">
                  65,432.10
                </p>
              </div>
              <div className="flex h-40 items-end gap-0.5 px-3 py-4">
                {[40, 55, 35, 70, 48, 82, 60, 75, 50, 90, 65, 55, 78, 45].map(
                  (h, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm",
                        i % 3 === 0 ? "bg-down/60" : "bg-up/60",
                      )}
                      style={{ height: `${h}%` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home.appTitle")}</h2>
          <p className="mt-3 text-muted">{t("home.appSubtitle")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-surface">
              <QrCode className="h-16 w-16 text-foreground/80" />
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="btn-cta-secondary flex w-44 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
              >
                <Apple className="h-4 w-4" />
                {t("home.appStore")}
              </button>
              <button
                type="button"
                className="btn-cta-secondary flex w-44 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
              >
                {t("home.googlePlay")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-surface-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            {t("home.faqTitle")}
          </h2>
          <div className="space-y-2">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
                  >
                    {item.q}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted transition",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="mx-auto max-w-5xl px-6 py-14 text-center">
        <h2 className="text-2xl font-bold">{t("home.communityTitle")}</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {socials.map((name) => (
            <button
              key={name}
              type="button"
              className="rounded-full border border-border bg-surface px-5 py-2 text-xs font-medium text-muted transition hover:border-amber-500/40 hover:text-foreground"
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-muted/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold">{t("home.footerAbout")}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>About Velora</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">{t("home.footerProducts")}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>
                <LocaleLink href="/trade/BTC-USDT" className="hover:text-foreground">
                  Spot
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/futures/BTC-USDT" className="hover:text-foreground">
                  Futures
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/markets" className="hover:text-foreground">
                  Markets
                </LocaleLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">{t("home.footerSupport")}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>Help Center</li>
              <li>API Docs</li>
              <li>Fees</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">{t("home.footerLegal")}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>
                <LocaleLink href="/legal/terms" className="hover:text-foreground">
                  Terms
                </LocaleLink>
              </li>
              <li>
                <LocaleLink href="/legal/risk" className="hover:text-foreground">
                  Risk
                </LocaleLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-6 py-4 text-center text-[11px] text-muted">
          © {new Date().getFullYear()} Velora Exchange
        </div>
      </footer>
    </div>
  );
}
