import type { CanonicalInterval } from "@/types/market";

export type PriceLevels = {
  symbol: string;
  interval: CanonicalInterval;
  price: number;
  supports: number[];
  resistances: number[];
};

export type PriceLevelsMode = "auto" | "manual";

export type PriceLevelsState = {
  enabled: boolean;
  mode: PriceLevelsMode;
  manualSupports: [string, string, string];
  manualResistances: [string, string, string];
};

export const DEFAULT_PRICE_LEVELS_STATE: PriceLevelsState = {
  enabled: false,
  mode: "auto",
  manualSupports: ["", "", ""],
  manualResistances: ["", "", ""],
};
