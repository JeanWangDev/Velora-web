"use client";

import { useMemo, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import {
  Anchor,
  Bell,
  Cloud,
  Feather,
  Flame,
  Gem,
  Heart,
  MessageCircle,
  RefreshCw,
  Rocket,
  Snowflake,
  Sprout,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface CaptchaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  instruction?: string;
}

type IconType = ComponentType<{ className?: string }>;

interface IconDef {
  id: string;
  Icon: IconType;
}

const ICON_POOL: IconDef[] = [
  { id: "anchor", Icon: Anchor },
  { id: "gem", Icon: Gem },
  { id: "feather", Icon: Feather },
  { id: "sprout", Icon: Sprout },
  { id: "wrench", Icon: Wrench },
  { id: "snowflake", Icon: Snowflake },
  { id: "bell", Icon: Bell },
  { id: "cloud", Icon: Cloud },
  { id: "flame", Icon: Flame },
  { id: "star", Icon: Star },
  { id: "heart", Icon: Heart },
  { id: "rocket", Icon: Rocket },
];

/** 每个图标在拼图区域内的占位区（左中右三栏，避免重叠），落点在栏内随机浮动 */
const SLOTS = [
  { leftRange: [10, 26] as const, topRange: [22, 68] as const },
  { leftRange: [40, 56] as const, topRange: [18, 72] as const },
  { leftRange: [70, 86] as const, topRange: [24, 66] as const },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomInRange([min, max]: readonly [number, number]): number {
  return min + Math.random() * (max - min);
}

interface Challenge {
  /** 需要按此顺序点击的图标 */
  order: IconDef[];
  /** 图标在拼图区域内的实际落点（顺序与 order 无关，故意打乱） */
  placements: { icon: IconDef; top: number; left: number }[];
}

function buildChallenge(): Challenge {
  const picked = shuffle(ICON_POOL).slice(0, 3);
  const slots = shuffle(SLOTS);
  const placements = picked.map((icon, i) => ({
    icon,
    top: randomInRange(slots[i].topRange),
    left: randomInRange(slots[i].leftRange),
  }));
  return { order: picked, placements };
}

/**
 * 依次点击图标的人机验证弹层（参考 GeeTest 智能点选交互，自研实现，非第三方 SDK）。
 * 生产环境可替换为真实 Turnstile / GeeTest 官方 SDK。
 */
export function CaptchaModal({
  open,
  onClose,
  onSuccess,
  title = "安全验证",
  instruction = "请在下图依次点击",
}: CaptchaModalProps) {
  const [challenge, setChallenge] = useState<Challenge>(() => buildChallenge());
  const [clickedIds, setClickedIds] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const done = clickedIds.length === challenge.order.length;

  function reset(newChallenge = true) {
    setClickedIds([]);
    setShaking(false);
    if (newChallenge) setChallenge(buildChallenge());
  }

  function handleIconClick(id: string) {
    if (shaking || verifying || clickedIds.includes(id)) return;
    const expected = challenge.order[clickedIds.length]?.id;
    if (id === expected) {
      setClickedIds((prev) => [...prev, id]);
      return;
    }
    setShaking(true);
    window.setTimeout(() => {
      setClickedIds([]);
      setShaking(false);
    }, 400);
  }

  async function handleConfirm() {
    if (!done || verifying) return;
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 500));
    setVerifying(false);
    reset();
    onSuccess();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const orderHint = useMemo(() => challenge.order, [challenge]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div
        className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl"
        role="dialog"
        aria-modal
        aria-labelledby="captcha-title"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p id="captcha-title" className="text-xs text-[#999]">
              {title}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-[#111]">
              {instruction}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#eee] bg-[#fafafa] px-2 py-1.5">
            {orderHint.map(({ id, Icon }) => (
              <Icon key={id} className="h-4 w-4 text-[#333]" />
            ))}
          </div>
        </div>

        <div
          className={cn(
            "relative h-44 w-full overflow-hidden rounded-lg bg-gradient-to-br from-[#151a2e] via-[#1c2440] to-[#2a1f45]",
            shaking && "captcha-shake",
          )}
        >
          <div className="pointer-events-none absolute -left-6 -top-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-2xl" />

          {challenge.placements.map(({ icon, top, left }) => {
            const clickedIndex = clickedIds.indexOf(icon.id);
            const isClicked = clickedIndex >= 0;
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => handleIconClick(icon.id)}
                disabled={verifying}
                aria-label={icon.id}
                style={{ top: `${top}%`, left: `${left}%` }}
                className={cn(
                  "absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg transition",
                  isClicked
                    ? "border-emerald-400 bg-emerald-400/90 text-white"
                    : "border-white/80 bg-white/95 text-[#222] hover:scale-105",
                )}
              >
                {isClicked ? (
                  <span className="text-xs font-bold">{clickedIndex + 1}</span>
                ) : (
                  <icon.Icon className="h-[18px] w-[18px]" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!done || verifying}
          onClick={() => void handleConfirm()}
          className={cn(
            "mt-3 w-full rounded-lg py-2.5 text-sm font-semibold transition",
            done && !verifying
              ? "bg-[#111] text-white hover:bg-[#222]"
              : "cursor-not-allowed bg-[#e8e8e8] text-[#bbb]",
          )}
        >
          {verifying ? "验证中…" : "确定"}
        </button>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClose}
              aria-label="关闭"
              className="rounded-full p-1.5 text-[#999] hover:bg-[#f5f5f5] hover:text-[#111]"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => reset()}
              aria-label="换一题"
              className="rounded-full p-1.5 text-[#999] hover:bg-[#f5f5f5] hover:text-[#111]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="反馈"
              className="rounded-full p-1.5 text-[#999] hover:bg-[#f5f5f5] hover:text-[#111]"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#ccc]">
            Velora Secure
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
