"use client";

import type { ReactNode } from "react";

type HoverTooltipProps = {
  title: string;
  description?: string;
  /** 竖条在页面右侧时，提示应出现在图标左侧 */
  side?: "left" | "right";
  children: ReactNode;
};

export function HoverTooltip({
  title,
  description,
  side = "left",
  children,
}: HoverTooltipProps) {
  return (
    <div className="group/tooltip relative flex">
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute top-1/2 z-50 w-max max-w-[12rem] -translate-y-1/2 rounded-md border border-border bg-surface px-2.5 py-2 text-left opacity-0 shadow-lg transition-opacity duration-150 group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100 ${
          side === "left" ? "right-full mr-2" : "left-full ml-2"
        }`}
      >
        <div className="text-xs font-semibold text-foreground">{title}</div>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
