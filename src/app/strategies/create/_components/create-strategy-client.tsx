"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChartTemplateService } from "@/services/chart-template-service";
import { StrategyService } from "@/services/strategy-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { ChartTemplate } from "@/types/chart-template";

const INTERVALS = ["15m", "1h", "4h", "1d"];

export function CreateStrategyClient() {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [templates, setTemplates] = useState<ChartTemplate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [strategyKey, setStrategyKey] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [templateId, setTemplateId] = useState("");
  const [tags, setTags] = useState("");
  const [followFeeUsdt, setFollowFeeUsdt] = useState("19");
  const [durationDays, setDurationDays] = useState("30");
  const [visibility, setVisibility] = useState<"draft" | "public">("public");

  const loadTemplates = useCallback(async () => {
    try {
      const result = await ChartTemplateService.listMine();
      setTemplates(result.data);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    void loadTemplates();
  }, [hydrated, user, loadTemplates]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error(t("strategies.loginRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await StrategyService.create({
        strategyKey: strategyKey.trim().toLowerCase(),
        name: name.trim(),
        summary: summary.trim(),
        description: description.trim(),
        symbol: symbol.trim().toUpperCase(),
        interval,
        templateId: templateId || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        followFeeUsdt: Number(followFeeUsdt),
        durationDays: Number(durationDays),
        visibility,
      });
      toast.success(t("strategies.createSuccess"));
      router.push(`/strategies/${result.strategy.strategyKey}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("strategies.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted">
        {t("strategies.loginRequired")}{" "}
        <Link href="/strategies" className="text-accent hover:underline">
          {t("strategies.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/strategies" className="text-sm text-accent hover:underline">
        ← {t("strategies.backToList")}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("strategies.createTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("strategies.createSubtitle")}</p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldKey")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={strategyKey}
            onChange={(e) => setStrategyKey(e.target.value)}
            placeholder="my_btc_trend"
            required
            pattern="[a-z0-9_]{3,20}"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldName")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={64}
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldSummary")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={255}
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldDescription")}</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("strategies.fieldSymbol")}</span>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("strategies.fieldInterval")}</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              {INTERVALS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldTemplate")}</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">{t("strategies.fieldTemplateNone")}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.symbol || "—"})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldTags")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="BTC,趋势"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("strategies.fieldFollowFee")}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={followFeeUsdt}
              onChange={(e) => setFollowFeeUsdt(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("strategies.fieldDuration")}</span>
            <input
              type="number"
              min={1}
              max={365}
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("strategies.fieldVisibility")}</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "draft" | "public")}
          >
            <option value="public">{t("strategies.visibilityPublic")}</option>
            <option value="draft">{t("strategies.visibilityDraft")}</option>
          </select>
        </label>

        <p className="text-xs text-muted">{t("strategies.platformFeeHint")}</p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {submitting ? t("strategies.creating") : t("strategies.createSubmit")}
        </button>
      </form>
    </section>
  );
}
