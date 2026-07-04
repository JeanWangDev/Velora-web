export const CHART_SCREENSHOT_FILENAME = "screenshot.png";

const TV_SNAPSHOT_BASE_URL = "https://www.tradingview.com/x/";

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerDownload(objectUrl, filename);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function resolveSnapshotImageUrl(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^(data:|blob:|https?:)/i.test(trimmed)) {
    return trimmed;
  }

  const id = trimmed.replace(/^\/+|\/+$/g, "");
  return `${TV_SNAPSHOT_BASE_URL}${id}/`;
}

/** 从 TV iframe 内 canvas 合成当前可见 K 线区域（同源，可本地导出 PNG）。 */
export function captureTradingViewChart(container: HTMLElement | null): string | null {
  if (!container) {
    return null;
  }

  const iframe = container.querySelector("iframe");
  const doc = iframe?.contentDocument ?? iframe?.contentWindow?.document;
  if (!doc) {
    return null;
  }

  const chartRoot =
    doc.querySelector("table.chart-markup-table") ??
    doc.querySelector(".chart-gui-wrapper") ??
    doc.body;

  const canvases = Array.from(chartRoot.querySelectorAll("canvas")).filter((canvas) => {
    if (canvas.width < 10 || canvas.height < 10) {
      return false;
    }

    const style = doc.defaultView?.getComputedStyle(canvas);
    return style?.visibility !== "hidden" && style?.display !== "none";
  });

  if (canvases.length === 0) {
    return null;
  }

  const rootRect = chartRoot.getBoundingClientRect();
  const width = Math.max(1, Math.round(rootRect.width));
  const height = Math.max(1, Math.round(rootRect.height));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const ctx = output.getContext("2d");
  if (!ctx) {
    return null;
  }

  const background =
    doc.defaultView?.getComputedStyle(chartRoot).backgroundColor ?? "#ffffff";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (const canvas of canvases) {
    const rect = canvas.getBoundingClientRect();
    const x = rect.left - rootRect.left;
    const y = rect.top - rootRect.top;

    try {
      ctx.drawImage(canvas, x, y, rect.width, rect.height);
    } catch {
      // 忽略不可导出的 canvas
    }
  }

  return output.toDataURL("image/png");
}

export async function downloadChartScreenshot(
  source: string,
  filename: string = CHART_SCREENSHOT_FILENAME,
): Promise<void> {
  const url = resolveSnapshotImageUrl(source);

  if (url.startsWith("data:")) {
    triggerDownload(url, filename);
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Screenshot fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    triggerBlobDownload(blob, filename);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function downloadChartScreenshotDataUrl(
  dataUrl: string,
  filename: string = CHART_SCREENSHOT_FILENAME,
): void {
  triggerDownload(dataUrl, filename);
}
