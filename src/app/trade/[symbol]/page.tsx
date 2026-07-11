"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSymbolRegistry } from "@/stores/use-symbol-registry";
import { useMarketStore } from "@/stores/use-market-store";
import { TradeWorkspace } from "@/components/exchange/okx/trade-workspace";

export default function TradeSymbolPage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const symbol = (params.symbol ?? "BTC-USDT").toUpperCase();
  const initSymbol = useMarketStore((s) => s.initSymbol);
  const isValidSymbol = useSymbolRegistry((s) => s.isValidSymbol);
  const loaded = useSymbolRegistry((s) => s.loaded);

  useEffect(() => {
    void useSymbolRegistry.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!isValidSymbol(symbol, "spot")) {
      router.replace("/trade/BTC-USDT");
    }
  }, [symbol, router, loaded, isValidSymbol]);

  useEffect(() => {
    initSymbol(symbol);
  }, [symbol, initSymbol]);

  return <TradeWorkspace symbol={symbol} mode="spot" />;
}
