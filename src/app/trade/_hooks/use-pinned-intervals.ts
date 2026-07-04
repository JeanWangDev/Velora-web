"use client";

import { useCallback, useState } from "react";
import { useLocalStorageState, useMount } from "ahooks";
import type { TVResolution } from "@/app/trade/_types/chart";
import {
  DEFAULT_PINNED_INTERVALS,
  normalizePinnedIntervals,
  PINNED_INTERVALS_STORAGE_KEY,
} from "@/app/trade/_config/intervals";

export function usePinnedIntervals() {
  const [hydrated, setHydrated] = useState(false);
  useMount(() => setHydrated(true));

  const [pinned, setPinnedRaw] = useLocalStorageState<TVResolution[]>(
    PINNED_INTERVALS_STORAGE_KEY,
    {
      defaultValue: [...DEFAULT_PINNED_INTERVALS],
      listenStorageChange: true,
    },
  );

  const normalized = normalizePinnedIntervals(pinned ?? DEFAULT_PINNED_INTERVALS);

  const setPinned = useCallback(
    (next: TVResolution[]) => {
      setPinnedRaw(normalizePinnedIntervals(next));
    },
    [setPinnedRaw],
  );

  const togglePinned = useCallback(
    (value: TVResolution) => {
      setPinnedRaw((prev) => {
        const current = normalizePinnedIntervals(prev ?? DEFAULT_PINNED_INTERVALS);
        const exists = current.includes(value);
        const next = exists
          ? current.filter((item) => item !== value)
          : [...current, value];
        return normalizePinnedIntervals(next);
      });
    },
    [setPinnedRaw],
  );

  return { pinned: normalized, setPinned, togglePinned, hydrated };
}
