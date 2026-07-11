"use client";

import { ExternalLink, Star } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale, useTranslation } from "@/i18n/use-translation";
import { useWatchlistStore } from "@/stores/use-watchlist-store";
import { getSymbolMeta } from "@/stores/use-symbol-registry";
import type { Ticker } from "@/types/exchange";
import {
  formatCompact,
  formatPercent,
  formatPrice,
  displayPair,
} from "@/utils/format-exchange";
import { SymbolPickerDropdown } from "@/components/exchange/okx/symbol-picker-dropdown";
import { CoinIcon } from "@/components/exchange/coin-icon";
import { useLayoutStore } from "@/stores/use-layout-store";
import { cn } from "@/lib/cn";
import type { TradeMode } from "@/stores/use-trade-mode-store";

function StatCell({
  label,
  value,
  valueClassName,
  link,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  link?: boolean;
}) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-0.5 px-2">
      <span className="inline-flex items-center gap-0.5 text-[10px] leading-none text-[var(--terminal-muted)]">
        {label}
        {link && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
      </span>
      <span
        className={cn(
          "font-mono text-xs font-medium leading-none tabular-nums text-[var(--terminal-text)]",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function InstrumentBar({
  ticker,
  mode = "spot",
}: {
  ticker: Ticker;
  mode?: TradeMode;
}) {
  const t = useExchangeT();
  const tt = useTranslation();
  const locale = useLocale();
  const layout = useLayoutStore((s) => s.layout);
  // 标准版右侧已有币对列表，宽平模式左侧已有市场面板 → 隐藏下拉
  const hidePicker = layout === "standard" || layout === "pro-left";
  const meta = getSymbolMeta(ticker.symbol);
  const toggle = useWatchlistStore((s) => s.toggle);
  const watched = useWatchlistStore((s) => s.isWatched(ticker.symbol));
  const precision = meta?.pricePrecision ?? 2;
  const up = ticker.change24h >= 0;
  const changeAbs = ticker.last - ticker.last / (1 + ticker.change24h / 100);
  const priceColor = up ? "text-up" : "text-down";

  const tagLabel = mode === "futures" ? "PERP" : "SPOT";
  const tagClass =
    mode === "futures" ? "bg-accent/15 text-accent" : "bg-up/15 text-up";

  return (
    <div className="relative z-30 flex h-12 shrink-0 items-center gap-1 border-b border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3">
      {/* 币对选择：不设 overflow，避免裁切下拉 */}
      <div className="relative z-40 flex shrink-0 items-center gap-2 pr-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--terminal-panel-2)] text-[11px] font-bold text-foreground">
          {meta?.base?.slice(0, 1) ?? "?"}
        </div>
        <div className="flex items-center gap-1.5">
          {hidePicker ? (
            /* 已有侧边列表，只展示静态名称 */
            <span className="flex items-center gap-1.5 px-1 text-base font-semibold text-[var(--terminal-text)]">
              <CoinIcon base={meta?.base ?? "?"} size="xs" />
              {displayPair(ticker.symbol)}
            </span>
          ) : (
            <SymbolPickerDropdown symbol={ticker.symbol} mode={mode} />
          )}
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              tagClass,
            )}
          >
            {tagLabel}
          </span>
          {mode === "futures" && (
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-mono text-primary">
              10x
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggle(ticker.symbol)}
          className="text-muted hover:text-accent"
          aria-label="watchlist"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              watched && "fill-amber-400 text-amber-400",
            )}
          />
        </button>
      </div>

      <div className="mx-1 h-6 w-px shrink-0 bg-[var(--terminal-border)]" />

      {/* 最新价 + 涨跌 */}
      <div className="flex shrink-0 flex-col gap-0.5 px-2">
        <span className={cn("font-mono text-sm font-semibold leading-none tabular-nums", priceColor)}>
          {formatPrice(ticker.last, precision, locale)}
        </span>
        <span className={cn("font-mono text-[10px] leading-none tabular-nums", priceColor)}>
          {up ? "+" : ""}
          {formatPrice(Math.abs(changeAbs), precision, locale)} (
          {formatPercent(ticker.change24h)})
        </span>
      </div>

      {/* 行情统计 */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {mode === "futures" && (
          <>
            <StatCell
              label={t("trade.indexPrice")}
              value={formatPrice(ticker.last * 0.9999, precision, locale)}
              link
            />
            <StatCell
              label={t("trade.markPrice")}
              value={formatPrice(ticker.last * 1.0001, precision, locale)}
            />
          </>
        )}
        <StatCell
          label={`${meta?.base ?? ""} ${t("trade.price")}`}
          value={`¥${formatPrice(ticker.last * 6.78, 1, locale)}`}
          link
        />
        <StatCell
          label={t("trade.low24h")}
          value={formatPrice(ticker.low24h, precision, locale)}
        />
        <StatCell
          label={t("trade.high24h")}
          value={formatPrice(ticker.high24h, precision, locale)}
        />
        <StatCell
          label={t("trade.vol24h")}
          value={`${formatCompact(ticker.volume24h, locale)} ${meta?.base ?? ""}`}
        />
        <StatCell
          label={tt("trade.ticker.quoteVol24h")}
          value={`${formatCompact(ticker.quoteVolume24h, locale)} ${meta?.quote ?? ""}`}
        />
        {mode === "futures" && (
          <StatCell label={t("trade.fundingRate")} value="0.0100%" />
        )}
      </div>

    </div>
  );
}
