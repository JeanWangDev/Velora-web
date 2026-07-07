"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import {
  useMarketConnectionStatus,
  type MarketConnectionStatus,
} from "@/hooks/use-market-connection-status";
import { cn } from "@/lib/cn";

const STATUS_STYLE: Record<
  MarketConnectionStatus,
  { className: string; Icon: typeof Wifi }
> = {
  stable: { className: "text-up", Icon: Wifi },
  reconnecting: { className: "text-amber-400", Icon: Loader2 },
  offline: { className: "text-rose-400", Icon: WifiOff },
};

const STATUS_LABEL_KEY: Record<MarketConnectionStatus, string> = {
  stable: "trade.networkStable",
  reconnecting: "trade.networkReconnecting",
  offline: "trade.networkOffline",
};

export function NetworkStatusBadge({ className }: { className?: string }) {
  const t = useExchangeT();
  const status = useMarketConnectionStatus();
  const { className: tone, Icon } = STATUS_STYLE[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px]",
        tone,
        className,
      )}
    >
      <Icon
        className={cn("h-3 w-3", status === "reconnecting" && "animate-spin")}
      />
      {t(STATUS_LABEL_KEY[status])}
    </span>
  );
}
