import type { TVWidgetInstance } from "@/types/charting-library";

const SUPPORT_COLOR = "#3b82f6";
const RESISTANCE_COLOR = "#ef4444";

let shapeEntityIds: string[] = [];

type ChartShapeApi = {
  createShape?: (
    point: { time: number; price?: number },
    options: Record<string, unknown>,
  ) => string | null;
  removeEntity?: (id: string) => void;
};

/** TV 在 remove 之后 activeChart/chart 仍可能存在，但内部 tradingViewApi 已为 null */
function getDrawChartApi(widget: TVWidgetInstance): ChartShapeApi | null {
  try {
    return widget.chart?.() ?? null;
  } catch {
    return null;
  }
}

function getActiveChartApi(widget: TVWidgetInstance): ChartShapeApi | null {
  try {
    return widget.activeChart?.() ?? widget.chart?.() ?? null;
  } catch {
    return null;
  }
}

/** 卸载时只清本地 id，避免在 widget 已销毁后调用 TV API */
export function resetPriceLevelShapeRegistry(): void {
  shapeEntityIds = [];
}

export function clearPriceLevelShapes(widget: TVWidgetInstance | null) {
  const ids = shapeEntityIds;
  shapeEntityIds = [];

  if (!widget || ids.length === 0) {
    return;
  }

  const chart = getActiveChartApi(widget);
  if (!chart?.removeEntity) {
    return;
  }

  for (const id of ids) {
    try {
      chart.removeEntity(id);
    } catch {
      /* widget 可能正在销毁 */
    }
  }
}

export function applyPriceLevelShapes(
  widget: TVWidgetInstance | null,
  supports: number[],
  resistances: number[],
) {
  clearPriceLevelShapes(widget);
  if (!widget) return;

  const chart = getDrawChartApi(widget);
  if (!chart?.createShape) return;

  const timeSec = Math.floor(Date.now() / 1000);

  const drawLine = (price: number, label: string, color: string) => {
    try {
      const id = chart.createShape?.(
        { time: timeSec, price },
        {
          shape: "horizontal_line",
          text: label,
          lock: true,
          disableSave: true,
          disableSelection: true,
          disableUndo: true,
          overrides: {
            linecolor: color,
            linewidth: 2,
            linestyle: 0,
          },
        },
      );
      if (id) {
        shapeEntityIds.push(id);
      }
    } catch {
      /* single line failure should not block others */
    }
  };

  supports.forEach((price, index) => {
    drawLine(price, `S${index + 1}`, SUPPORT_COLOR);
  });

  resistances.forEach((price, index) => {
    drawLine(price, `R${index + 1}`, RESISTANCE_COLOR);
  });
}
