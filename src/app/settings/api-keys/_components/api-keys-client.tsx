"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { ApiKeyService, type ApiKeyRow } from "@/services/api-key-service";
import { toast } from "@/services/toast";

export function ApiKeysClient() {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [symbolWhitelist, setSymbolWhitelist] = useState("");
  const [newSecret, setNewSecret] = useState<{ apiKey: string; apiSecret: string } | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState<
    { method: string; path: string; statusCode: number; ip: string; ts: number }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiKeyService.list();
      setRows(res.data ?? []);
    } catch {
      toast.error("加载 API Key 失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await ApiKeyService.create({
        label: label || "Trading API",
        ipWhitelist: ipWhitelist.trim(),
        symbolWhitelist: symbolWhitelist.trim(),
      });
      setNewSecret({ apiKey: res.apiKey, apiSecret: res.apiSecret });
      setLabel("");
      setIpWhitelist("");
      setSymbolWhitelist("");
      toast.success("API Key 已创建");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (apiKey: string) => {
    if (!window.confirm("确认吊销此 API Key？")) return;
    try {
      await ApiKeyService.revoke(apiKey);
      toast.success("已吊销");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("已复制");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">API Key 管理</h1>
        <p className="mt-1 text-sm text-muted">
          OKX 风格 HMAC-SHA256 鉴权。请求头：x-api-key、x-api-sign、x-api-timestamp
        </p>
      </div>

      {newSecret && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-600">请立即保存 Secret，关闭后无法再次查看</p>
          <div className="mt-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">API Key</span>
              <button type="button" onClick={() => copy(newSecret.apiKey)} className="text-primary">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="break-all">{newSecret.apiKey}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Secret</span>
              <button type="button" onClick={() => copy(newSecret.apiSecret)} className="text-primary">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="break-all">{newSecret.apiSecret}</p>
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-muted hover:underline"
            onClick={() => setNewSecret(null)}
          >
            我已保存，关闭
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="备注名称"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={creating}
            onClick={() => void create()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            创建
          </button>
        </div>
        <input
          value={ipWhitelist}
          onChange={(e) => setIpWhitelist(e.target.value)}
          placeholder="IP 白名单（逗号分隔，留空=不限制）"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <input
          value={symbolWhitelist}
          onChange={(e) => setSymbolWhitelist(e.target.value)}
          placeholder="交易对白名单（如 BTC-USDT,ETH-USDT，留空=全部）"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">加载中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">暂无 API Key</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-2 text-left">名称</th>
                <th className="px-4 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">权限</th>
                <th className="px-4 py-2 text-left">IP / 交易对</th>
                <th className="px-4 py-2 text-left">状态</th>
                <th className="px-4 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.apiKey}</td>
                  <td className="px-4 py-3 text-xs">{r.permissions}</td>
                  <td className="px-4 py-3 text-[10px] text-muted">
                    <div>{r.ipWhitelist || "全部 IP"}</div>
                    <div>{r.symbolWhitelist || "全部交易对"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 1 ? (
                      <span className="text-emerald-600">有效</span>
                    ) : (
                      <span className="text-muted">已吊销</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {r.status === 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void ApiKeyService.logs(r.apiKey).then((res) => {
                              setLogsFor(r.apiKey);
                              setLogs(res.data ?? []);
                            })
                          }
                          className="text-xs text-primary hover:underline"
                        >
                          日志
                        </button>
                        <button
                          type="button"
                          onClick={() => void revoke(r.apiKey)}
                          className="text-rose-500 hover:underline"
                        >
                          <Trash2 className="inline h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logsFor && (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">最近调用 · {logsFor}</p>
            <button
              type="button"
              className="text-xs text-muted hover:underline"
              onClick={() => setLogsFor(null)}
            >
              关闭
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-muted">暂无调用记录</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs font-mono">
              {logs.map((l, i) => (
                <li key={i} className="flex justify-between gap-2 border-b border-border/40 py-1">
                  <span>
                    {l.method} {l.path}
                  </span>
                  <span className="text-muted">
                    {l.statusCode} · {l.ip}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-muted/30 p-4 text-xs text-muted">
        <KeyRound className="mb-2 h-4 w-4" />
        <p>签名串：timestamp + method + path + body</p>
        <p className="mt-1">签名算法：HMAC-SHA256(secret, payload) → hex</p>
      </div>
    </div>
  );
}
