"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExchangeService } from "@/services/exchange-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";

export function ExchangesSettingsClient() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ExchangeService.list();
      const okx = result.connections.find((c) => c.exchange === "okx");
      setConnected(!!okx);
      setConnectionId(okx?.id ?? null);
    } catch {
      setConnected(false);
      setConnectionId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    void load();
  }, [hydrated, user, load]);

  const handleConnect = async () => {
    setSubmitting(true);
    try {
      const result = await ExchangeService.connectOkx({ apiKey, secretKey, passphrase });
      setConnectionId(result.connection.id);
      setConnected(true);
      setApiKey("");
      setSecretKey("");
      setPassphrase("");
      toast.success(t("exchanges.connectSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("exchanges.connectFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setSubmitting(true);
    try {
      await ExchangeService.disconnectOkx();
      setConnected(false);
      setConnectionId(null);
      toast.success(t("exchanges.disconnectSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("exchanges.disconnectFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return null;

  if (!user) {
    return <p className="px-4 py-16 text-center text-sm text-muted">{t("strategies.loginRequired")}</p>;
  }

  return (
    <section className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <Link href="/strategies" className="text-sm text-accent hover:underline">
        ← {t("strategies.backToList")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("exchanges.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("exchanges.subtitle")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("strategies.loading")}</p>
      ) : connected ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("exchanges.okxConnected")}</p>
          <p className="text-xs text-muted">ID: {connectionId}</p>
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm"
            disabled={submitting}
            onClick={() => void handleDisconnect()}
          >
            {t("exchanges.disconnect")}
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Secret Key"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          <button
            type="button"
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground disabled:opacity-50"
            disabled={submitting}
            onClick={() => void handleConnect()}
          >
            {t("exchanges.connectOkx")}
          </button>
        </div>
      )}
    </section>
  );
}
