/**
 * 布局缩略图 — 用 SVG 模拟各布局区域，带 K线/订单簿/下单面板等视觉元素
 */
import type React from "react";

const BG = "#131722";
const PANEL = "#1c2030";
const BORDER = "#2a2d3a";
const GREEN = "#26a69a";
const RED = "#ef5350";
const MUTED = "#4a4f6a";
const TEXT = "#6b7280";

/** 迷你 K 线蜡烛组 */
function MiniCandles({
  x, y, w, h,
  candles = [
    { up: true,  body: 0.6, wick: 0.8 },
    { up: false, body: 0.5, wick: 0.7 },
    { up: true,  body: 0.7, wick: 0.9 },
    { up: false, body: 0.4, wick: 0.6 },
    { up: true,  body: 0.8, wick: 1.0 },
    { up: true,  body: 0.5, wick: 0.7 },
    { up: false, body: 0.6, wick: 0.85 },
    { up: true,  body: 0.9, wick: 1.0 },
  ],
}: {
  x: number; y: number; w: number; h: number;
  candles?: { up: boolean; body: number; wick: number }[];
}) {
  const count = candles.length;
  const gap = 1;
  const cw = (w - gap * (count - 1)) / count;
  const maxH = h * 0.85;
  const baseY = y + h;

  return (
    <g>
      {candles.map((c, i) => {
        const cx = x + i * (cw + gap);
        const bodyH = maxH * c.body * 0.5;
        const wickH = maxH * c.wick * 0.6;
        const fill = c.up ? GREEN : RED;
        const bodyY = baseY - bodyH;
        const wickX = cx + cw / 2;
        return (
          <g key={i}>
            <line x1={wickX} y1={baseY - wickH} x2={wickX} y2={baseY} stroke={fill} strokeWidth={0.6} />
            <rect x={cx} y={bodyY} width={cw} height={bodyH} fill={fill} rx={0.3} />
          </g>
        );
      })}
    </g>
  );
}

/** 迷你订单簿价格行 */
function MiniBook({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const rows = 6;
  const rh = h / rows;
  const maxBarW = w * 0.55;
  const bars = [0.9, 0.7, 0.5, 0.4, 0.6, 0.8];
  const colors = [RED, RED, RED, GREEN, GREEN, GREEN];
  return (
    <g>
      {bars.map((ratio, i) => (
        <g key={i}>
          <rect
            x={i < 3 ? x + w - ratio * maxBarW : x}
            y={y + i * rh + 0.5}
            width={ratio * maxBarW}
            height={rh - 1}
            fill={colors[i]}
            opacity={0.18}
            rx={0.5}
          />
          <rect x={x} y={y + i * rh + rh / 2 - 0.3} width={w * 0.35} height={0.6} fill={colors[i]} opacity={0.6} rx={0.3} />
          <rect x={x + w * 0.55} y={y + i * rh + rh / 2 - 0.3} width={w * 0.35} height={0.6} fill={MUTED} opacity={0.5} rx={0.3} />
        </g>
      ))}
      {/* 中间分割线 */}
      <rect x={x} y={y + (h / 2) - 0.5} width={w} height={1} fill={BORDER} />
    </g>
  );
}

/** 迷你下单面板 */
function MiniForm({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      {/* 买卖 tab */}
      <rect x={x} y={y} width={w / 2 - 0.5} height={4} fill={GREEN} opacity={0.8} rx={1} />
      <rect x={x + w / 2 + 0.5} y={y} width={w / 2 - 0.5} height={4} fill={PANEL} rx={1} />
      {/* 输入框 */}
      {[10, 18, 26].map((dy) => (
        <rect key={dy} x={x} y={y + dy} width={w} height={5} fill={BORDER} rx={1} />
      ))}
      {/* 滑块 */}
      <rect x={x} y={y + 36} width={w} height={2} fill={BORDER} rx={1} />
      <circle cx={x + w * 0.3} cy={y + 37} r={2} fill={GREEN} />
      {/* 买入按钮 */}
      <rect x={x} y={y + h - 8} width={w} height={7} fill={GREEN} opacity={0.9} rx={1.5} />
    </g>
  );
}

/** 迷你图表面板（含 K 线 + 底部成交量） */
function MiniChart({
  x, y, w, h,
  candles,
}: {
  x: number; y: number; w: number; h: number;
  candles?: Parameters<typeof MiniCandles>[0]["candles"];
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={BG} rx={1} />
      {/* 时间周期 tab 条 */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 2 + i * 7} y={y + 2} width={5} height={2.5} fill={i === 1 ? MUTED : BORDER} rx={0.5} />
      ))}
      {/* K 线区 */}
      <MiniCandles x={x + 2} y={y + 7} w={w - 4} h={h * 0.62} candles={candles} />
      {/* 均线 */}
      <polyline
        points={`${x+2},${y+h*0.55} ${x+w*0.25},${y+h*0.45} ${x+w*0.5},${y+h*0.4} ${x+w*0.75},${y+h*0.35} ${x+w-2},${y+h*0.3}`}
        fill="none" stroke="#f39c12" strokeWidth={0.6} opacity={0.7}
      />
      {/* 成交量 */}
      {[0,1,2,3,4,5,6,7].map((i) => {
        const bw = (w - 4) / 8 - 1;
        const bh = [6,4,8,5,7,3,9,6][i] ?? 5;
        const fill = i % 2 === 0 ? GREEN : RED;
        return (
          <rect key={i} x={x + 2 + i * ((w-4)/8)} y={y + h - bh - 1} width={bw} height={bh} fill={fill} opacity={0.5} rx={0.3} />
        );
      })}
    </g>
  );
}

const W = 120;
const H = 80;

/**
 * 标准版（图一）：
 * LEFT 书本/成交 | CENTER K线(上)+下单(下) | RIGHT 币对列表
 */
export function ThumbStandard() {
  const bw = 30, cw = 58, sw = 30;
  const formH = H * 0.38;
  const chartH = H - formH - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      {/* 左: 订单簿+成交 */}
      <MiniBook x={0} y={0} w={bw} h={H} />
      <rect x={bw} y={0} width={0.5} height={H} fill={BORDER} />
      {/* 中: K线(上) */}
      <MiniChart x={bw + 1} y={0} w={cw - 1} h={chartH} />
      {/* 中: 下单(下) */}
      <rect x={bw + 1} y={chartH} width={cw - 1} height={0.5} fill={BORDER} />
      <MiniForm x={bw + 2} y={chartH + 2} w={cw - 3} h={formH - 4} />
      {/* 右: 币对列表 */}
      <rect x={bw + cw} y={0} width={0.5} height={H} fill={BORDER} />
      {[0,1,2,3,4].map((i) => (
        <g key={i}>
          <circle cx={bw + cw + 5} cy={8 + i * 14} r={3} fill={i % 2 === 0 ? GREEN : RED} opacity={0.7} />
          <rect x={bw + cw + 10} y={6 + i * 14} width={sw - 12} height={2} fill={MUTED} opacity={0.6} rx={0.5} />
          <rect x={bw + cw + 10} y={9 + i * 14} width={(sw - 12) * 0.7} height={1.5} fill={i % 2 === 0 ? GREEN : RED} opacity={0.6} rx={0.5} />
        </g>
      ))}
    </svg>
  );
}

/**
 * 专业模式（图二，当前方案）：
 * LEFT K线(大) | CENTER 订单簿 | RIGHT 下单
 */
export function ThumbProRight() {
  const cw = 60, bw = 28, fw = 30;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      <MiniChart x={0} y={0} w={cw} h={H} />
      <rect x={cw} y={0} width={0.5} height={H} fill={BORDER} />
      <MiniBook x={cw + 1} y={0} w={bw - 1} h={H} />
      <rect x={cw + bw} y={0} width={0.5} height={H} fill={BORDER} />
      <MiniForm x={cw + bw + 1} y={2} w={fw - 2} h={H - 4} />
    </svg>
  );
}

/** 迷你市场列表列 */
function MiniMarketList({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const rows = 5;
  const rh = h / rows;
  const colors = [GREEN, RED, GREEN, RED, GREEN];
  return (
    <g>
      {/* 搜索框 */}
      <rect x={x + 1} y={y + 1} width={w - 2} height={4} fill={BORDER} rx={1} />
      {/* 行 */}
      {Array.from({ length: rows }).map((_, i) => (
        <g key={i}>
          <circle cx={x + 5} cy={y + 8 + i * rh + rh / 2} r={2.5} fill={colors[i]} opacity={0.7} />
          <rect x={x + 9} y={y + 8 + i * rh + rh / 2 - 1.5} width={w * 0.3} height={2} fill={MUTED} opacity={0.6} rx={0.5} />
          <rect x={x + w - 12} y={y + 8 + i * rh + rh / 2 - 1.5} width={10} height={2} fill={colors[i]} opacity={0.7} rx={0.5} />
        </g>
      ))}
    </g>
  );
}

/**
 * 宽平模式（图三）：
 * 市场列表 | 下单 | K线(大) | 订单簿 | 最新成交
 */
export function ThumbProLeft() {
  const mw = 18, fw = 22, cw = 40, bw = 22, tw = 16;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      {/* 市场列表 */}
      <MiniMarketList x={0} y={0} w={mw} h={H} />
      <rect x={mw} y={0} width={0.5} height={H} fill={BORDER} />
      {/* 下单 */}
      <MiniForm x={mw + 1} y={2} w={fw - 2} h={H - 4} />
      <rect x={mw + fw} y={0} width={0.5} height={H} fill={BORDER} />
      {/* K线 */}
      <MiniChart x={mw + fw + 1} y={0} w={cw - 1} h={H} />
      <rect x={mw + fw + cw} y={0} width={0.5} height={H} fill={BORDER} />
      {/* 订单簿 */}
      <MiniBook x={mw + fw + cw + 1} y={0} w={bw - 1} h={H} />
      <rect x={mw + fw + cw + bw} y={0} width={0.5} height={H} fill={BORDER} />
      {/* 最新成交 */}
      {[0,1,2,3,4,5].map((i) => (
        <g key={i}>
          <rect x={mw+fw+cw+bw+2} y={3+i*12} width={tw-3} height={1.5} fill={i%2===0 ? GREEN : RED} opacity={0.7} rx={0.3} />
          <rect x={mw+fw+cw+bw+2} y={6+i*12} width={(tw-3)*0.6} height={1.5} fill={MUTED} opacity={0.5} rx={0.3} />
        </g>
      ))}
    </svg>
  );
}

/** K线交易：大图表 + 右侧窄下单 */
export function ThumbChartTrade() {
  const cw = 84, fw = 34;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      <MiniChart x={0} y={0} w={cw} h={H} />
      <rect x={cw} y={0} width={0.5} height={H} fill={BORDER} />
      <MiniForm x={cw + 1} y={2} w={fw - 2} h={H - 4} />
    </svg>
  );
}

const CANDLES_B: { up: boolean; body: number; wick: number }[] = [
  { up: false, body: 0.5, wick: 0.7 },
  { up: true,  body: 0.6, wick: 0.85 },
  { up: false, body: 0.7, wick: 0.9 },
  { up: true,  body: 0.4, wick: 0.6 },
  { up: false, body: 0.8, wick: 1.0 },
  { up: true,  body: 0.5, wick: 0.7 },
  { up: true,  body: 0.6, wick: 0.85 },
  { up: false, body: 0.9, wick: 1.0 },
];

const CANDLES_C: { up: boolean; body: number; wick: number }[] = [
  { up: true,  body: 0.4, wick: 0.6 },
  { up: true,  body: 0.7, wick: 0.9 },
  { up: false, body: 0.5, wick: 0.7 },
  { up: true,  body: 0.6, wick: 0.8 },
  { up: false, body: 0.9, wick: 1.0 },
  { up: true,  body: 0.4, wick: 0.6 },
  { up: false, body: 0.7, wick: 0.85 },
  { up: true,  body: 0.5, wick: 0.7 },
];

/** 2图：两个图表并排，底部各自下单 */
export function ThumbDual() {
  const hw = W / 2 - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      <MiniChart x={0} y={0} w={hw} h={H * 0.72} />
      <rect x={0} y={H * 0.72} width={hw} height={0.5} fill={BORDER} />
      <MiniForm x={1} y={H * 0.72 + 1} w={hw - 2} h={H * 0.28 - 2} />
      <rect x={hw + 0.5} y={0} width={0.5} height={H} fill={BORDER} />
      <MiniChart x={hw + 1} y={0} w={hw} h={H * 0.72} candles={CANDLES_B} />
      <rect x={hw + 1} y={H * 0.72} width={hw} height={0.5} fill={BORDER} />
      <MiniForm x={hw + 2} y={H * 0.72 + 1} w={hw - 2} h={H * 0.28 - 2} />
    </svg>
  );
}

/** 3图：三个图表并排 */
export function ThumbTriple() {
  const tw = (W - 2) / 3;
  const candleSets: ({ up: boolean; body: number; wick: number }[] | undefined)[] = [
    undefined, CANDLES_B, CANDLES_C,
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect width={W} height={H} fill={BG} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <MiniChart
            x={i * (tw + 1)}
            y={0}
            w={tw}
            h={H}
            candles={candleSets[i]}
          />
          {i < 2 && (
            <rect x={(i + 1) * (tw + 1) - 1} y={0} width={0.5} height={H} fill={BORDER} />
          )}
        </g>
      ))}
    </svg>
  );
}

export const LAYOUT_THUMBS: Record<string, () => React.ReactElement> = {
  standard:    ThumbStandard,
  "pro-right": ThumbProRight,
  "pro-left":  ThumbProLeft,
};
