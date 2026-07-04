"use client";

import { useState } from "react";
import { X, Maximize2 } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { MOCK_ANNOUNCEMENTS } from "@/mocks/exchange-data";
import { formatDateTime } from "@/utils/format-exchange";
import { cn } from "@/lib/cn";

const MOCK_NEWS = [
  {
    id: "n1",
    titleZh: "巨鲸近 3 个月累计增持超 27 万枚 BTC",
    titleEn: "Whales accumulated 270k BTC in 3 months",
    summaryZh: "链上数据显示大型地址持续吸筹，市场关注度上升。",
    summaryEn: "On-chain data shows large addresses accumulating.",
    tag: "BTC",
    change: 0.01,
    bullish: true,
    ts: Date.now() - 3600_000,
  },
  {
    id: "n2",
    titleZh: "Solana 2026 Q2 网络升级路线图公布",
    titleEn: "Solana Q2 2026 upgrade roadmap",
    summaryZh: "核心团队公布性能优化与生态扩展计划。",
    summaryEn: "Core team published performance roadmap.",
    tag: "SOL",
    change: -0.08,
    bullish: true,
    ts: Date.now() - 7200_000,
  },
];

export function NewsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useExchangeT();
  const locale = useLocale();
  if (!open) return null;

  const items = [...MOCK_NEWS, ...MOCK_ANNOUNCEMENTS.slice(0, 2).map((a) => ({
    id: a.id,
    titleZh: a.titleZh,
    titleEn: a.titleEn,
    summaryZh: a.summaryZh,
    summaryEn: a.summaryEn,
    tag: "BTC",
    change: 0,
    bullish: false,
    ts: a.publishedAt,
  }))];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(80vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--terminal-border)] bg-[#0a0a0a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--terminal-border)] px-4 py-3">
          <h2 className="text-base font-semibold">{t("trade.tabNews")}</h2>
          <div className="flex gap-1">
            <button type="button" className="rounded p-1 text-muted hover:text-foreground">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="terminal-scroll flex-1 overflow-y-auto p-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="border-b border-[var(--terminal-border)] py-4 last:border-0"
            >
              <div className="mb-1 flex items-center gap-2 text-[10px] text-muted">
                <time>{formatDateTime(item.ts, locale)}</time>
                {"bullish" in item && item.bullish && (
                  <span className="text-up">{t("trade.bullish")}</span>
                )}
              </div>
              <h3 className="text-sm font-medium leading-snug">
                {locale === "zh" ? item.titleZh : item.titleEn}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {locale === "zh" ? item.summaryZh : item.summaryEn}
              </p>
              {"tag" in item && (
                <span
                  className={cn(
                    "mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-mono",
                    item.change >= 0 ? "bg-up/15 text-up" : "bg-down/15 text-down",
                  )}
                >
                  {item.tag} {item.change >= 0 ? "+" : ""}
                  {item.change}%
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
