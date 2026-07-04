"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MOCK_SYMBOLS } from "@/mocks/exchange-data";
import { useMockMarketStore } from "@/stores/use-mock-market-store";
import { TradeWorkspace } from "@/components/exchange/okx/trade-workspace";

export default function FuturesSymbolPage() {
  const params = useParams<{ symbol: string }>();
  const router = useRouter();
  const symbol = (params.symbol ?? "BTC-USDT").toUpperCase();
  const initSymbol = useMockMarketStore((s) => s.initSymbol);

  useEffect(() => {
    if (!MOCK_SYMBOLS.some((s) => s.symbol === symbol)) {
      router.replace("/futures/BTC-USDT");
    }
  }, [symbol, router]);

  useEffect(() => {
    initSymbol(symbol);
  }, [symbol, initSymbol]);

  return <TradeWorkspace symbol={symbol} mode="futures" />;
}
