/**
 * /dashboard 客户端主体：Recharts 图表与概览卡片，数据来自 useDashboardStore。
 */
"use client";

import { useEffect } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Siren,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import { useDashboardStore } from "@/app/dashboard/_stores/use-dashboard-store";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function severityStyles(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-100";
  }

  if (severity === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
}

/**
 * Recharts is rendered into SVG — it doesn't pick up CSS variables natively,
 * so we compute palette values from the active theme here.
 */
function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return {
    grid: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)",
    axis: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#020617" : "#ffffff",
    tooltipBorder: isDark
      ? "1px solid rgba(148, 163, 184, 0.16)"
      : "1px solid rgba(15, 23, 42, 0.1)",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
  };
}

export function DashboardPageClient() {
  const data = useDashboardStore((state) => state.data);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const fetchOverview = useDashboardStore((state) => state.fetchOverview);
  const chartTheme = useChartTheme();

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  // 首屏加载
  if (loading && !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-[32px] border border-border bg-surface p-6">
          <p className="text-sm text-muted">正在加载大盘数据…</p>
        </div>
      </section>
    );
  }

  // 无缓存数据时的错误态
  if (error && !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-[32px] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-900 dark:text-rose-50">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-600 dark:text-rose-200/80">
            Dashboard Error
          </p>
          <h1 className="mt-3 text-2xl font-semibold">加载失败</h1>
          <p className="mt-3 text-sm text-muted">{error}</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-8">
      {/* ─── Hero overview ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[32px] border border-accent/20 bg-gradient-to-br from-accent/15 via-surface to-surface p-6 shadow-2xl shadow-accent/10">
          <p className="text-sm uppercase tracking-[0.35em] text-accent/80">
            Market Overview
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                全网综合大盘
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                {data.summary}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-surface-muted px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                市场偏向
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-500 dark:text-emerald-300">
                {data.marketBias}
              </p>
              <p className="mt-1 text-xs text-muted">
                数据更新时间 {new Date(data.updatedAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Sentiment card ─────────────────────────────────────────────── */}
        <div className="rounded-[32px] border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-300">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted">恐惧贪婪指数</p>
              <p className="text-3xl font-semibold text-foreground">
                {data.sentiment.value}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-foreground/80">
            {data.sentiment.description}
          </p>
          <p className="mt-2 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-600 dark:text-violet-200">
            {data.sentiment.label}
          </p>
          <div className="mt-6 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sentiment.trend}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axis}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: chartTheme.tooltipBorder,
                    borderRadius: 16,
                    color: chartTheme.tooltipText,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#22d3ee", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Market grid + derivatives ──────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-4">
        {data.market.map((asset) => {
          const positive = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              className="rounded-3xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">{asset.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {asset.symbol}
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs ${
                    positive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                  }`}
                >
                  {formatPercent(asset.change24h)}
                </div>
              </div>

              <p className="mt-5 text-3xl font-semibold text-foreground">
                {formatCurrency(asset.price)}
              </p>
              <p className="mt-2 text-sm text-muted">
                24h 成交量 {formatCurrency(asset.volume24h)}
              </p>
              <p className="mt-4 text-sm leading-6 text-foreground/80">
                {asset.signal}
              </p>
            </div>
          );
        })}

        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent/10 p-3 text-accent">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted">衍生品状态</p>
              <p className="text-xl font-semibold text-foreground">
                {data.derivatives.liquidationBias}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-foreground/80">
            <div className="flex items-center justify-between">
              <span>资金费率均值</span>
              <span className="font-medium text-foreground">
                {data.derivatives.fundingRateAvg.toFixed(3)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>多空持仓比</span>
              <span className="font-medium text-foreground">
                {data.derivatives.longShortRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>24h 爆仓额</span>
              <span className="font-medium text-foreground">
                {formatCurrency(data.derivatives.liquidations24h)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stablecoin + exchange balance ──────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-border bg-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">稳定币净流入</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                交易所净流动趋势
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs text-muted">
              <ArrowUpRight className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
              单位：百万美元
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stablecoinNetflow}>
                <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axis}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: chartTheme.tooltipBorder,
                    borderRadius: 16,
                    color: chartTheme.tooltipText,
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {data.stablecoinNetflow.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.value >= 0 ? "#22c55e" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-surface p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted">交易所余额</p>
              <h2 className="text-2xl font-semibold text-foreground">
                筹码流向监控
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {data.exchangeBalance.map((item) => {
              const positive = item.change24h >= 0;

              return (
                <div
                  key={item.symbol}
                  className="rounded-3xl border border-border bg-surface-muted p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                      {item.symbol}
                    </p>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                        positive
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      }`}
                    >
                      {positive ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {formatPercent(item.change24h)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground/80">
                    {item.commentary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Whale alerts + quick signals ───────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[32px] border border-border bg-surface p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-600 dark:text-fuchsia-200">
              <Siren className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted">巨鲸异动</p>
              <h2 className="text-2xl font-semibold text-foreground">
                实时大额转账追踪
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {data.whaleAlerts.map((alert) => (
              <div
                key={`${alert.asset}-${alert.source}-${alert.timeAgo}`}
                className="rounded-3xl border border-border bg-surface-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {alert.asset} {formatCurrency(alert.amountUsd)}
                    </p>
                    <p className="text-sm text-muted">{alert.source}</p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs ${
                      alert.direction === "inflow"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-200"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {alert.direction === "inflow" ? "流入交易所" : "流出交易所"}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-foreground/80">
                  {alert.impact}
                </p>
                <p className="mt-3 text-xs text-muted">{alert.timeAgo}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">快速信号</p>
              <h2 className="text-2xl font-semibold text-foreground">
                风险与机会提示
              </h2>
            </div>
            <div className="text-xs text-muted">适合后续接入预警引擎</div>
          </div>

          <div className="space-y-4">
            {data.quickSignals.map((signal) => (
              <div
                key={signal.title}
                className={`rounded-3xl border p-4 ${severityStyles(signal.severity)}`}
              >
                <p className="text-lg font-semibold">{signal.title}</p>
                <p className="mt-2 text-sm leading-6 opacity-90">
                  {signal.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-surface-muted p-4">
            <p className="text-sm text-muted">情绪动量</p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sentiment.trend}>
                  <defs>
                    <linearGradient
                      id="sentimentFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartTheme.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={chartTheme.axis}
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: chartTheme.tooltipBorder,
                      borderRadius: 16,
                      color: chartTheme.tooltipText,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#c084fc"
                    strokeWidth={2}
                    fill="url(#sentimentFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
