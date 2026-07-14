"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { PlatformService } from "@/services/platform-service";
import { toast } from "@/services/toast";

interface EarnProduct {
  productNo: string;
  currency: string;
  name: string;
  apr: number;
  minAmount: number;
}

interface EarnPosition {
  id: number;
  productNo: string;
  currency: string;
  principal: number;
  accrued: number;
}

export default function EarnPage() {
  const t = useExchangeT();
  const [products, setProducts] = useState<EarnProduct[]>([]);
  const [positions, setPositions] = useState<EarnPosition[]>([]);
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState("");

  const load = async () => {
    const [p, pos] = await Promise.all([
      PlatformService.listEarnProducts(),
      PlatformService.listEarnPositions().catch(() => ({ data: [] as EarnPosition[] })),
    ]);
    setProducts(p.data as EarnProduct[]);
    setPositions(pos.data as EarnPosition[]);
    if (!selected && p.data[0]) setSelected((p.data[0] as EarnProduct).productNo);
  };

  useEffect(() => {
    void load();
  }, []);

  const subscribe = async () => {
    const amt = Number(amount);
    if (!(amt > 0) || !selected) return;
    try {
      await PlatformService.subscribeEarn(selected, amt);
      toast.success(t("common.success"));
      setAmount("");
      await load();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const redeem = async (id: number) => {
    try {
      await PlatformService.redeemEarn(id);
      toast.success(t("common.success"));
      await load();
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="aurora-bg mx-auto max-w-4xl px-4 py-8">
      <Link href="/assets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">{t("trade.redeemEarn")}</h1>

      <div className="glass-panel mb-6 rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-medium">{t("trade.depositCrypto")}</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {products.map((p) => (
            <option key={p.productNo} value={p.productNo}>
              {p.name} · APR {(Number(p.apr) * 100).toFixed(2)}%
            </option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void subscribe()}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white"
        >
          Subscribe
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h2 className="mb-3 text-sm font-medium">My positions</h2>
        {positions.length === 0 ? (
          <p className="text-sm text-muted">{t("common.noData")}</p>
        ) : (
          <ul className="space-y-2">
            {positions.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  {p.currency} · {p.principal} + {p.accrued}
                </span>
                <button
                  type="button"
                  onClick={() => void redeem(p.id)}
                  className="text-accent hover:underline"
                >
                  Redeem
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
