"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { PlatformService } from "@/services/platform-service";
import { toast } from "@/services/toast";
import { formatPrice } from "@/utils/format-exchange";
import { useLocale } from "@/i18n/use-translation";

interface OptionRow {
  symbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  optionType: string;
  mark: number;
  spot: number;
}

export default function OptionsPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const [rows, setRows] = useState<OptionRow[]>([]);
  const [qty, setQty] = useState("1");

  useEffect(() => {
    void PlatformService.listOptions().then((res) => setRows(res.data as OptionRow[]));
  }, []);

  const buy = async (symbol: string) => {
    const quantity = Number(qty);
    if (!(quantity > 0)) return;
    try {
      await PlatformService.placeOptionOrder(symbol, "buy", quantity);
      toast.success(t("trade.orderPlaced"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="aurora-bg mx-auto max-w-5xl px-4 py-8">
      <Link href="/trade/BTC-USDT" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Options</h1>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Strike</th>
              <th className="px-4 py-3 text-right">Mark</th>
              <th className="px-4 py-3 text-right">Spot</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-t border-border/60">
                <td className="px-4 py-3 font-mono text-xs">{r.symbol}</td>
                <td className="px-4 py-3 uppercase">{r.optionType}</td>
                <td className="px-4 py-3 text-right font-mono">{formatPrice(r.strike, 0, locale)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatPrice(r.mark, 2, locale)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatPrice(r.spot, 2, locale)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void buy(r.symbol)}
                    className="text-accent hover:underline"
                  >
                    Buy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
