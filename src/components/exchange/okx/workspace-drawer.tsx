"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  X, Moon, Sun, Volume2, VolumeX, RotateCcw, Check
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useLayoutStore, LAYOUTS, type LayoutPreset } from "@/stores/use-layout-store";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import { LAYOUT_THUMBS } from "./layout-thumbnails";

type Tab = "layout" | "appearance" | "trading";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
        value ? "bg-[var(--terminal-accent)]" : "bg-[var(--terminal-border)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
          value ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--terminal-muted)]">
      {children}
    </p>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-[var(--terminal-text)]">{label}</span>
      {children}
    </div>
  );
}

/** 布局 Tab */
function LayoutTab() {
  const layout = useLayoutStore((s) => s.layout);
  const setLayout = useLayoutStore((s) => s.setLayout);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionTitle>布局模板</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map((l) => {
            const Thumb = LAYOUT_THUMBS[l.id];
            const active = layout === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setLayout(l.id as LayoutPreset)}
                className={cn(
                  "group relative flex flex-col gap-1 rounded-lg border p-1.5 transition-all duration-200",
                  active
                    ? "border-[var(--terminal-accent)] bg-[var(--terminal-accent)]/10"
                    : "border-[var(--terminal-border)] bg-[var(--terminal-panel)] hover:border-[var(--terminal-accent)]/50",
                )}
              >
                {/* 选中勾 */}
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--terminal-accent)]">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                {/* SVG 缩略图 */}
                <div className="aspect-[3/2] w-full overflow-hidden rounded">
                  <Thumb />
                </div>
                <span
                  className={cn(
                    "text-center text-[11px] leading-none",
                    active
                      ? "font-medium text-[var(--terminal-accent)]"
                      : "text-[var(--terminal-muted)] group-hover:text-[var(--terminal-text)]",
                  )}
                >
                  {l.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLayout("standard")}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--terminal-border)] py-2 text-xs text-[var(--terminal-muted)] transition hover:border-[var(--terminal-accent)]/50 hover:text-[var(--terminal-text)]"
      >
        <RotateCcw className="h-3 w-3" />
        恢复默认布局
      </button>
    </div>
  );
}

/** 外观 Tab */
function AppearanceTab() {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
  const { riseFall, setRiseFall, setTheme: setPrefTheme } = usePreferencesStore();

  const handleThemeChange = (t: "dark" | "light") => {
    setNextTheme(t);
    setPrefTheme(t);
  };

  const theme = (nextTheme === "dark" || nextTheme === "light") ? nextTheme : "dark";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionTitle>主题</SectionTitle>
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleThemeChange(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs transition-all",
                theme === t
                  ? "border-[var(--terminal-accent)] bg-[var(--terminal-accent)]/10 text-[var(--terminal-accent)]"
                  : "border-[var(--terminal-border)] text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {t === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {t === "dark" ? "暗色" : "亮色"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>涨跌颜色</SectionTitle>
        <div className="flex gap-2">
          {([
            { id: "intl", up: "#26a69a", down: "#ef5350", label: "绿涨红跌" },
            { id: "cn",   up: "#ef5350", down: "#26a69a", label: "红涨绿跌" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRiseFall(opt.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-lg border py-2.5 transition-all",
                riseFall === opt.id
                  ? "border-[var(--terminal-accent)] bg-[var(--terminal-accent)]/10"
                  : "border-[var(--terminal-border)] hover:border-[var(--terminal-accent)]/50",
              )}
            >
              <div className="flex gap-1">
                <span
                  className="h-4 w-2 rounded-sm text-[0px]"
                  style={{ background: opt.up }}
                >▲</span>
                <span
                  className="h-4 w-2 rounded-sm text-[0px]"
                  style={{ background: opt.down }}
                >▼</span>
              </div>
              <span
                className={cn(
                  "text-[11px]",
                  riseFall === opt.id
                    ? "text-[var(--terminal-accent)]"
                    : "text-[var(--terminal-muted)]",
                )}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 交易 Tab */
function TradingTab() {
  const p = usePreferencesStore();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionTitle>交易设置</SectionTitle>
        <div className="divide-y divide-[var(--terminal-border)]">
          <Row label="市价未完成交易提示">
            <Toggle value={p.marketIncompleteHint} onChange={p.setMarketIncompleteHint} />
          </Row>
        </div>
      </div>

      <div>
        <SectionTitle>确认弹窗</SectionTitle>
        <div className="divide-y divide-[var(--terminal-border)]">
          <Row label="限价">
            <Toggle value={p.confirmLimit} onChange={p.setConfirmLimit} />
          </Row>
          <Row label="市价">
            <Toggle value={p.confirmMarket} onChange={p.setConfirmMarket} />
          </Row>
          <Row label="止盈止损">
            <Toggle value={p.confirmStopLoss} onChange={p.setConfirmStopLoss} />
          </Row>
          <Row label="追单">
            <Toggle value={p.confirmChase} onChange={p.setConfirmChase} />
          </Row>
        </div>
      </div>

      <div>
        <SectionTitle>订单通知</SectionTitle>
        <div className="divide-y divide-[var(--terminal-border)]">
          <Row label="订单成交">
            <Toggle value={p.notifyFill} onChange={p.setNotifyFill} />
          </Row>
          <Row label="订单撤销">
            <Toggle value={p.notifyCancel} onChange={p.setNotifyCancel} />
          </Row>
          <Row label="声音">
            <div className="flex items-center gap-2">
              {p.notifySound
                ? <Volume2 className="h-3.5 w-3.5 text-[var(--terminal-muted)]" />
                : <VolumeX className="h-3.5 w-3.5 text-[var(--terminal-muted)]" />}
              <Toggle value={p.notifySound} onChange={p.setNotifySound} />
            </div>
          </Row>
        </div>
      </div>

      <div>
        <SectionTitle>K线开盘价</SectionTitle>
        <div className="flex gap-2">
          {([
            { id: "prev-close", label: "上期收盘价" },
            { id: "first-trade", label: "首笔成交价" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => p.setCandleOpen(opt.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-all",
                p.candleOpen === opt.id
                  ? "border-[var(--terminal-accent)] bg-[var(--terminal-accent)]/10 text-[var(--terminal-accent)]"
                  : "border-[var(--terminal-border)] text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {p.candleOpen === opt.id && <Check className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>涨跌幅起始时间</SectionTitle>
        <div className="flex gap-2">
          {([
            { id: "24h", label: "24H" },
            { id: "utc", label: "UTC 时间" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => p.setVolatilityBase(opt.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-all",
                p.volatilityBase === opt.id
                  ? "border-[var(--terminal-accent)] bg-[var(--terminal-accent)]/10 text-[var(--terminal-accent)]"
                  : "border-[var(--terminal-border)] text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {p.volatilityBase === opt.id && <Check className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 主抽屉组件 */
export function WorkspaceDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("layout");
  const backdropRef = useRef<HTMLDivElement>(null);

  // 点击遮罩关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "layout",     label: "布局" },
    { id: "appearance", label: "外观" },
    { id: "trading",    label: "交易" },
  ];

  return (
    <>
      {/* 遮罩（透明，仅用于点击关闭） */}
      <div
        ref={backdropRef}
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          open ? "pointer-events-auto" : "pointer-events-none opacity-0",
        )}
      />

      {/* 抽屉主体 */}
      <div
        className={cn(
          "fixed right-0 top-[48px] z-50 flex h-[calc(100dvh-48px)] w-72 flex-col",
          "border-l border-[var(--terminal-border)] bg-[var(--terminal-bg)] shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* 头部 */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--terminal-border)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--terminal-text)]">工作区设置</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--terminal-muted)] transition hover:bg-[var(--terminal-panel)] hover:text-[var(--terminal-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 栏 */}
        <div className="flex shrink-0 border-b border-[var(--terminal-border)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "border-b-2 border-[var(--terminal-accent)] text-[var(--terminal-accent)]"
                  : "text-[var(--terminal-muted)] hover:text-[var(--terminal-text)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容区（可滚动） */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "layout"     && <LayoutTab />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "trading"    && <TradingTab />}
        </div>
      </div>
    </>
  );
}
