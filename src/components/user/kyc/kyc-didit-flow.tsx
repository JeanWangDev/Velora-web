"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { KycService } from "@/services/kyc-service";
import { toast } from "@/services/toast";

interface KycDiditFlowProps {
  onSynced: () => void;
  onCancel?: () => void;
}

export function KycDiditFlow({ onSynced, onCancel }: KycDiditFlowProps) {
  const t = useExchangeT();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncSession = useCallback(
    async (sessionId: string) => {
      setSyncing(true);
      try {
        await KycService.syncDidit(sessionId);
        onSynced();
        toast.success(t("user.kycDiditSynced"));
      } catch (e) {
        const message = e instanceof Error ? e.message : t("user.kycDiditSyncFailed");
        toast.error(message);
      } finally {
        setSyncing(false);
      }
    },
    [onSynced, t],
  );

  /** Didit 回调会带上 verificationSessionId + status */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionId =
      params.get("verificationSessionId") ||
      params.get("session_id") ||
      params.get("sessionId");
    if (!sessionId) return;

    void syncSession(sessionId).finally(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("verificationSessionId");
      url.searchParams.delete("session_id");
      url.searchParams.delete("sessionId");
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.pathname + url.search);
    });
  }, [syncSession]);

  async function startVerification() {
    setLoading(true);
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;

      const res = await KycService.createDiditSession({
        callbackUrl,
        language: locale === "zh" ? "zh" : "en",
      });

      if (!res?.url) {
        throw new Error(t("user.kycDiditStartFailed"));
      }

      window.location.href = res.url;
    } catch (e) {
      const message = e instanceof Error ? e.message : t("user.kycDiditStartFailed");
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">{t("user.kycDiditTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("user.kycDiditSubtitle")}</p>
        </div>

        <ul className="mt-6 space-y-2.5 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {t("user.kycDiditStepId")}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {t("user.kycDiditStepLiveness")}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {t("user.kycDiditStepReview")}
          </li>
        </ul>

        <div className="mt-8 space-y-3">
          <Button
            className="w-full"
            disabled={loading || syncing}
            onClick={() => void startVerification()}
          >
            {loading || syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            {syncing ? t("user.kycDiditSyncing") : t("user.kycDiditStart")}
          </Button>

          {onCancel ? (
            <Button variant="ghost" className="w-full" onClick={onCancel}>
              {t("common.back")}
            </Button>
          ) : null}
        </div>

        <p className="mt-5 text-center text-xs text-muted">{t("user.kycPrivacyNote")}</p>
      </div>
    </div>
  );
}
