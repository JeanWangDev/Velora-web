"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Search } from "lucide-react";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateRankingsPanel } from "@/app/templates/_components/template-rankings-panel";
import { TemplateNameModal } from "@/components/templates/template-name-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useTranslation } from "@/i18n/use-translation";
import { ChartTemplateService } from "@/services/chart-template-service";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "@/services/toast";
import type { ChartTemplate } from "@/types/chart-template";
import { SymbolPicker } from "@/components/symbol-picker";
import { useTradeSymbol } from "@/app/trade/_hooks/use-trade-symbol";
import {
  buildCopyTemplateName,
  markTemplateAsDefault,
  matchesTemplateSymbol,
  resolveTemplateSymbol,
  sortTemplatesWithDefaultFirst,
} from "@/utils/chart-template";
import { trackTemplateUsage } from "@/utils/track-template-usage";
import { TradingPairsService } from "@/services/trading-pairs-service";
import type { TradingPair } from "@/types/trading-pair";

type TemplateTab = "public" | "mine";

type TemplateDialog =
  | null
  | { kind: "copy"; template: ChartTemplate }
  | { kind: "rename"; template: ChartTemplate }
  | { kind: "delete"; template: ChartTemplate };

export function TemplatesPageClient() {
  const t = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [tab, setTab] = useState<TemplateTab>("public");
  const [items, setItems] = useState<ChartTemplate[]>([]);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAllSymbols, setShowAllSymbols] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [dialog, setDialog] = useState<TemplateDialog>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const allowedSymbols = useMemo(() => pairs.map((p) => p.symbol), [pairs]);
  const defaultSymbol = useMemo(
    () => pairs.find((p) => p.isDefault)?.symbol ?? "BTCUSDT",
    [pairs],
  );
  const { symbol, setSymbol } = useTradeSymbol(allowedSymbols, defaultSymbol);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const listOptions = showAllSymbols ? undefined : { symbol };
      if (tab === "public") {
        const res = await ChartTemplateService.listPublic(listOptions);
        setItems(res.data);
      } else {
        if (!user) {
          setItems([]);
          return;
        }
        const res = await ChartTemplateService.listMine(listOptions);
        setItems(sortTemplatesWithDefaultFirst(res.data));
      }
    } catch (error) {
      setItems([]);
      toast.error(error instanceof Error ? error.message : t("templatesPage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [showAllSymbols, symbol, tab, t, user]);

  useEffect(() => {
    void TradingPairsService.list()
      .then((list) => {
        if (list.length > 0) setPairs(list);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const filtered = useMemo(() => {
    const scoped = showAllSymbols
      ? items
      : items.filter((item) => matchesTemplateSymbol(item, symbol, pairs));

    const q = query.trim().toLowerCase();
    if (!q) return scoped;

    return scoped.filter((item) => {
      const refSymbol = resolveTemplateSymbol(item, pairs) ?? item.symbol;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        refSymbol.toLowerCase().includes(q)
      );
    });
  }, [items, pairs, query, showAllSymbols, symbol]);

  const handleDelete = (template: ChartTemplate) => {
    setDialog({ kind: "delete", template });
  };

  const confirmDelete = async () => {
    if (dialog?.kind !== "delete") return;

    setDeleteSubmitting(true);
    try {
      await ChartTemplateService.remove(dialog.template.id);
      setItems((prev) => prev.filter((item) => item.id !== dialog.template.id));
      toast.success(t("templatesPage.deleted"));
      setDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("templatesPage.deleteFailed"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleRename = (template: ChartTemplate) => {
    setDialog({ kind: "rename", template });
  };

  const confirmRename = async (nextName: string) => {
    if (dialog?.kind !== "rename") return;
    if (nextName === dialog.template.name) {
      setDialog(null);
      return;
    }

    try {
      const updated = await ChartTemplateService.update(dialog.template.id, { name: nextName });
      setItems((prev) => prev.map((item) => (item.id === dialog.template.id ? updated : item)));
      toast.success(t("templatesPage.renamed"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("templatesPage.renameFailed"));
      throw error;
    }
  };

  const handleSetDefault = async (template: ChartTemplate) => {
    if (template.isDefault) {
      toast.info(t("templatesPage.alreadyDefault"));
      return;
    }

    try {
      const updated = await ChartTemplateService.setDefault(template.id);
      setItems((prev) =>
        sortTemplatesWithDefaultFirst(markTemplateAsDefault(prev, updated)),
      );
      toast.success(t("templatesPage.defaultSet"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("templatesPage.defaultSetFailed"));
    }
  };

  const handleApply = (template: ChartTemplate) => {
    trackTemplateUsage(template, "apply");
    const symbol = resolveTemplateSymbol(template, pairs);
    const params = new URLSearchParams();
    if (symbol) params.set("symbol", symbol);
    params.set("templateId", template.id);
    router.push(`/trade?${params.toString()}`);
  };

  const handleCopy = (template: ChartTemplate) => {
    if (!user) {
      toast.info(t("templatesPage.loginRequiredToCopy"));
      setLoginOpen(true);
      return;
    }
    setDialog({ kind: "copy", template });
  };

  const confirmCopy = async (nextName: string) => {
    if (dialog?.kind !== "copy") return;

    try {
      await ChartTemplateService.create({
        name: nextName,
        symbolId: dialog.template.symbolId,
        symbol: dialog.template.symbol,
        indicatorIds: dialog.template.indicatorIds,
        visibility: "private",
        isDefault: false,
      });
      trackTemplateUsage(dialog.template, "copy");
      toast.success(t("templatesPage.copied"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("templatesPage.copyFailed"));
      throw error;
    }
  };

  const handleTabChange = (next: TemplateTab) => {
    if (next === "mine" && !user) {
      toast.info(t("templatesPage.loginRequired"));
      setLoginOpen(true);
      return;
    }
    setTab(next);
  };

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("templatesPage.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("templatesPage.subtitle")}</p>
        </div>
        <Link
          href="/trade"
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
        >
          {t("templatesPage.openTrade")}
        </Link>
      </div>

      <TemplateRankingsPanel pairs={pairs} onApply={handleApply} />

      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => handleTabChange("public")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "public"
              ? "bg-accent/10 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t("templatesPage.tabPublic")}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("mine")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "mine" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          {t("templatesPage.tabMine")}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SymbolPicker value={symbol} onChange={setSymbol} />
          <p className="text-xs text-muted">
            {showAllSymbols
              ? t("templatesPage.symbolFilterAll")
              : t("templatesPage.symbolFilterHint").replace("{symbol}", symbol)}
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={showAllSymbols}
            onChange={(e) => setShowAllSymbols(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-accent"
          />
          {t("templatesPage.showAllSymbols")}
        </label>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("templatesPage.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      {tab === "mine" && !user ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <Layers className="h-10 w-10 text-muted" />
          <p className="text-sm text-muted">{t("templatesPage.loginRequired")}</p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("templatesPage.login")}
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="text-sm text-foreground">{t("templatesPage.empty")}</p>
          <p className="mt-2 text-xs text-muted">
            {tab === "mine" ? t("templatesPage.emptyHintMine") : t("templatesPage.emptyHintPublic")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              pairs={pairs}
              mode={tab}
              onApply={handleApply}
              onCopy={tab === "public" ? handleCopy : undefined}
              onDelete={tab === "mine" ? handleDelete : undefined}
              onRename={tab === "mine" ? handleRename : undefined}
              onSetDefault={tab === "mine" ? (tpl) => void handleSetDefault(tpl) : undefined}
            />
          ))}
        </ul>
      )}

      <TemplateNameModal
        open={dialog?.kind === "copy"}
        onClose={() => setDialog(null)}
        title={t("templatesPage.copyTitle")}
        description={t("templatesPage.copyDescription")}
        initialName={dialog?.kind === "copy" ? buildCopyTemplateName(dialog.template.name) : ""}
        confirmLabel={t("templatesPage.copyToPrivate")}
        onConfirm={confirmCopy}
      />

      <TemplateNameModal
        open={dialog?.kind === "rename"}
        onClose={() => setDialog(null)}
        title={t("templatesPage.renameTitle")}
        initialName={dialog?.kind === "rename" ? dialog.template.name : ""}
        confirmLabel={t("templatesPage.confirm")}
        onConfirm={confirmRename}
      />

      <ConfirmModal
        open={dialog?.kind === "delete"}
        onClose={() => setDialog(null)}
        title={t("templatesPage.deleteTitle")}
        message={t("templatesPage.deleteConfirm")}
        confirmLabel={t("templatesPage.delete")}
        cancelLabel={t("templatesPage.cancel")}
        onConfirm={confirmDelete}
        danger
        submitting={deleteSubmitting}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
