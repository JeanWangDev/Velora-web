"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import {
  getOcrPhases,
  type KycOcrPhase,
  type KycOcrResult,
} from "@/services/kyc-ocr-service";
import { cn } from "@/lib/cn";

interface KycOcrProcessingProps {
  frontPreview?: string;
  onDone: (result: KycOcrResult) => void;
  run: (
    onPhase: (phase: KycOcrPhase) => void,
  ) => Promise<KycOcrResult>;
}

const phaseLabelKey: Record<KycOcrPhase, string> = {
  detecting: "user.kycOcrDetecting",
  reading: "user.kycOcrReading",
  validating: "user.kycOcrValidating",
  done: "user.kycOcrDone",
};

export function KycOcrProcessing({ frontPreview, onDone, run }: KycOcrProcessingProps) {
  const t = useExchangeT();
  const [phase, setPhase] = useState<KycOcrPhase>("detecting");
  const [error, setError] = useState<string | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await run((p) => {
          if (!cancelled) setPhase(p);
        });
        if (!cancelled) onDoneRef.current(result);
      } catch {
        if (!cancelled) setError(t("user.kycOcrFailed"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [run, t]);

  const phases = getOcrPhases();
  const currentIdx = phases.indexOf(phase);

  return (
    <div className="space-y-8 py-4 text-center">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("user.kycOcrTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t(phaseLabelKey[phase])}</p>
      </div>

      <div className="relative mx-auto max-w-[240px]">
        {frontPreview ? (
          <div className="relative overflow-hidden rounded-xl ring-2 ring-primary/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontPreview}
              alt=""
              className="h-36 w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/20" />
            <div
              className="kyc-scan-line pointer-events-none absolute inset-x-0 h-1 bg-primary/80 shadow-[0_0_12px] shadow-primary/50"
            />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-xl bg-surface-muted ring-1 ring-border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <ul className="mx-auto max-w-xs space-y-2 text-left text-sm">
        {phases.slice(0, -1).map((p, i) => {
          const done = i < currentIdx || phase === "done";
          const active = p === phase;
          return (
            <li
              key={p}
              className={cn(
                "flex items-center gap-2",
                done ? "text-emerald-600 dark:text-emerald-400" : active ? "text-foreground" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  done
                    ? "bg-emerald-500/15"
                    : active
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-muted",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              {t(phaseLabelKey[p])}
            </li>
          );
        })}
      </ul>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
