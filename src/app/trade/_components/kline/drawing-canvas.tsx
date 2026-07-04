"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { useDrawingStore } from "@/app/trade/_stores/use-drawing-store";
import type {
  Drawing,
  HorizontalLineDrawing,
  RectangleDrawing,
  TextLabelDrawing,
  TrendLineDrawing,
} from "@/app/trade/_types/drawing";

// ─── public handle ────────────────────────────────────────────────────────────

export interface DrawingCanvasHandle {
  redraw(): void;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface DrawingCanvasProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
}

// ─── internal types ───────────────────────────────────────────────────────────

interface PendingPoint {
  time: number;
  price: number;
}

interface TextInputState {
  x: number;
  y: number;
  time: number;
  price: number;
  value: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ chartRef, seriesRef }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pendingRef = useRef<PendingPoint | null>(null);
    const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [textInput, setTextInput] = useState<TextInputState | null>(null);

    const { activeTool, activeColor, drawings, addDrawing } = useDrawingStore();

    // ── coordinate helpers ──────────────────────────────────────────────────

    /**
     * Convert a canvas pixel position to chart (time, price).
     * time is snapped to the nearest data bar via coordinateToTime.
     */
    function pixelToChartPoint(
      x: number,
      y: number,
    ): PendingPoint | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const time = chart.timeScale().coordinateToTime(x as any) as UTCTimestamp | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = series.coordinateToPrice(y as any);
      if (time === null || price === null) return null;

      return { time: time as number, price };
    }

    /**
     * Convert chart (time, price) back to canvas pixel.
     * Returns null if the point is not currently visible / not in data.
     */
    function chartPointToPixel(
      time: number,
      price: number,
    ): { x: number; y: number } | null {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return null;

      const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
      const y = series.priceToCoordinate(price);
      if (x === null || y === null) return null;

      return { x, y };
    }

    // ── canvas rendering ────────────────────────────────────────────────────

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render all completed drawings
      for (const drawing of drawings) {
        renderDrawing(ctx, drawing, canvas.width);
      }

      // Render in-progress preview
      if (pendingRef.current && activeTool !== "cursor") {
        const start = chartPointToPixel(
          pendingRef.current.time,
          pendingRef.current.price,
        );
        if (start) {
          const end = mouseRef.current;
          ctx.strokeStyle = activeColor;
          ctx.fillStyle = activeColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);

          if (activeTool === "trendline") {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          } else if (activeTool === "rectangle") {
            const rx = Math.min(start.x, end.x);
            const ry = Math.min(start.y, end.y);
            const rw = Math.abs(end.x - start.x);
            const rh = Math.abs(end.y - start.y);
            ctx.globalAlpha = 0.15;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.globalAlpha = 1;
            ctx.strokeRect(rx, ry, rw, rh);
          }

          ctx.setLineDash([]);

          // Start-point dot
          ctx.beginPath();
          ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    // chartPointToPixel and renderDrawing* only read stable refs — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawings, activeTool, activeColor]);

    function renderDrawing(
      ctx: CanvasRenderingContext2D,
      drawing: Drawing,
      canvasWidth: number,
    ) {
      ctx.strokeStyle = drawing.color;
      ctx.fillStyle = drawing.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);

      if (drawing.type === "hline") {
        renderHLine(ctx, drawing as HorizontalLineDrawing, canvasWidth);
      } else if (drawing.type === "trendline") {
        renderTrendLine(ctx, drawing as TrendLineDrawing);
      } else if (drawing.type === "rectangle") {
        renderRectangle(ctx, drawing as RectangleDrawing);
      } else if (drawing.type === "text") {
        renderTextLabel(ctx, drawing as TextLabelDrawing);
      }
    }

    function renderHLine(
      ctx: CanvasRenderingContext2D,
      d: HorizontalLineDrawing,
      canvasWidth: number,
    ) {
      const series = seriesRef.current;
      if (!series) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const y = series.priceToCoordinate(d.price) as any as number | null;
      if (y === null) return;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();

      // Price label badge
      const label = d.price.toFixed(2);
      ctx.font = "11px monospace";
      const tw = ctx.measureText(label).width;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(canvasWidth - tw - 12, y - 11, tw + 10, 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = d.color;
      ctx.fillText(label, canvasWidth - tw - 7, y + 1);
    }

    function renderTrendLine(
      ctx: CanvasRenderingContext2D,
      d: TrendLineDrawing,
    ) {
      const p1 = chartPointToPixel(d.startTime, d.startPrice);
      const p2 = chartPointToPixel(d.endTime, d.endPrice);
      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function renderRectangle(
      ctx: CanvasRenderingContext2D,
      d: RectangleDrawing,
    ) {
      const p1 = chartPointToPixel(d.startTime, d.startPrice);
      const p2 = chartPointToPixel(d.endTime, d.endPrice);
      if (!p1 || !p2) return;

      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.abs(p2.x - p1.x);
      const rh = Math.abs(p2.y - p1.y);

      ctx.globalAlpha = 0.1;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.globalAlpha = 1;
      ctx.strokeRect(rx, ry, rw, rh);

      // Corner dots
      for (const [px, py] of [
        [p1.x, p1.y],
        [p2.x, p2.y],
      ]) {
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function renderTextLabel(
      ctx: CanvasRenderingContext2D,
      d: TextLabelDrawing,
    ) {
      const p = chartPointToPixel(d.time, d.price);
      if (!p) return;

      ctx.font = "bold 12px sans-serif";
      const tw = ctx.measureText(d.text).width;
      const pad = 6;

      // Dark pill background
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(p.x - pad / 2, p.y - 16, tw + pad, 20);
      ctx.globalAlpha = 1;

      ctx.fillStyle = d.color;
      ctx.fillText(d.text, p.x, p.y);

      // Anchor dot
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── expose handle ────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({ redraw }), [redraw]);

    // ── resize canvas to match container ─────────────────────────────────────

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas?.parentElement) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          redraw();
        }
      });
      observer.observe(canvas.parentElement);
      return () => observer.disconnect();
    }, [redraw]);

    // ── redraw when drawings list changes ─────────────────────────────────────

    useEffect(() => {
      redraw();
    }, [redraw]);

    // ── mouse handlers ────────────────────────────────────────────────────────

    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);
        mouseRef.current = { x, y };
        if (pendingRef.current) {
          redraw();
        }
      },
      [redraw],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool === "cursor") return;

        const { x, y } = getCanvasCoords(e);
        const point = pixelToChartPoint(x, y);
        if (!point) return;

        // ── single-click tools ──────────────────────────────────────────────

        if (activeTool === "hline") {
          addDrawing({
            id: crypto.randomUUID(),
            type: "hline",
            color: activeColor,
            price: point.price,
          });
          return;
        }

        if (activeTool === "text") {
          setTextInput({ x, y, time: point.time, price: point.price, value: "" });
          return;
        }

        // ── two-click tools (trendline / rectangle) ─────────────────────────

        if (!pendingRef.current) {
          pendingRef.current = point;
          redraw();
        } else {
          const start = pendingRef.current;
          pendingRef.current = null;

          if (activeTool === "trendline") {
            addDrawing({
              id: crypto.randomUUID(),
              type: "trendline",
              color: activeColor,
              startTime: start.time,
              startPrice: start.price,
              endTime: point.time,
              endPrice: point.price,
            });
          } else if (activeTool === "rectangle") {
            addDrawing({
              id: crypto.randomUUID(),
              type: "rectangle",
              color: activeColor,
              startTime: start.time,
              startPrice: start.price,
              endTime: point.time,
              endPrice: point.price,
            });
          }
        }
      },
      [activeTool, activeColor, addDrawing, redraw], // eslint-disable-line react-hooks/exhaustive-deps
    );

    // Cancel pending when switching tools
    useEffect(() => {
      pendingRef.current = null;
      setTextInput(null);
      redraw();
    }, [activeTool, redraw]);

    // ── text label submit ─────────────────────────────────────────────────────

    const handleTextSubmit = useCallback(() => {
      if (!textInput) return;
      const trimmed = textInput.value.trim();
      if (trimmed) {
        addDrawing({
          id: crypto.randomUUID(),
          type: "text",
          color: activeColor,
          time: textInput.time,
          price: textInput.price,
          text: trimmed,
        });
      }
      setTextInput(null);
    }, [textInput, activeColor, addDrawing]);

    // ── cursor style ──────────────────────────────────────────────────────────

    const cursorStyle =
      activeTool === "cursor"
        ? "default"
        : activeTool === "text"
          ? "text"
          : "crosshair";

    // ─────────────────────────────────────────────────────────────────────────

    return (
      <div className="pointer-events-none absolute inset-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            pointerEvents: activeTool === "cursor" ? "none" : "auto",
            cursor: cursorStyle,
          }}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        />

        {/* Floating text input for annotation tool */}
        {textInput && (
          <input
            autoFocus
            type="text"
            value={textInput.value}
            placeholder="输入标注..."
            onChange={(e) =>
              setTextInput((prev) =>
                prev ? { ...prev, value: e.target.value } : null,
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextSubmit();
              if (e.key === "Escape") setTextInput(null);
            }}
            onBlur={handleTextSubmit}
            className="pointer-events-auto absolute z-10 w-36 rounded border border-cyan-400/40 bg-slate-900 px-2 py-1 text-sm text-white outline-none ring-1 ring-cyan-400/20"
            style={{
              left: textInput.x,
              top: Math.max(0, textInput.y - 28),
            }}
          />
        )}
      </div>
    );
  },
);
