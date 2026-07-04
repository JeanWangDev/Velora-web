"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/use-preferences-store";

export function RiseFallSync() {
  const riseFall = usePreferencesStore((s) => s.riseFall);

  useEffect(() => {
    document.documentElement.dataset.riseFall =
      riseFall === "cn" ? "cn" : "intl";
  }, [riseFall]);

  return null;
}
