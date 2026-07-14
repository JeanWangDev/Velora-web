"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, RefreshCw, ShieldAlert } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuthStore } from "@/stores/use-auth-store";
import { AdminPlatformService } from "@/services/admin-platform-service";
import { toast } from "@/services/toast";
import { isAdminUser } from "@/utils/admin";

export function AdminPlatformClient() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAdmin = isAdminUser(user);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<unknown[]>([]);
  const [insurance, setInsurance] = useState<unknown[]>([]);
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const [running, setRunning] = useState(false);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [b, i, a] = await Promise.all([
        AdminPlatformService.listSettlementBatches(),
        AdminPlatformService.listInsuranceFund(),
        AdminPlatformService.listAmlAlerts(),
      ]);
      setBatches(b.data);
      setInsurance(i.data);
      setAlerts(a.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const runSettlement = async () => {
    setRunning(true);
    try {
      const res = await AdminPlatformService.runSettlement();
      toast.success(`清算批次 ${res.batchNo}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "清算失败");
    } finally {
      setRunning(false);
    }
  };

  const scanDeposits = async () => {
    setScanning(true);
    try {
      const res = await AdminPlatformService.scanDeposits();
      toast.success(`匹配 ${res.matched} 笔充币`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "扫链失败");
    } finally {
      setScanning(false);
    }
  };

  if (!hydrated) {
    return <div className="text-sm text-muted">加载中…</div>;
  }

  if (!user) {
    return (
      <>
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          请登录管理员账号
        </div>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        <button type="button" className="mt-4 text-sm text-primary" onClick={() => setLoginOpen(true)}>
          登录
        </button>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        当前账号无管理权限
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">平台运维</h1>
          <p className="mt-1 text-sm text-muted">日终清算、保险基金、AML 告警、充币扫链</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-muted"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => void runSettlement()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          执行日终清算
        </button>
        <button
          type="button"
          disabled={scanning}
          onClick={() => void scanDeposits()}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          TRC20 充币扫链
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted">加载中…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="清算批次" count={batches.length}>
            <JsonList data={batches} />
          </Panel>
          <Panel title="保险基金" count={insurance.length}>
            <JsonList data={insurance} />
          </Panel>
          <Panel title="AML 告警" count={alerts.length}>
            <JsonList data={alerts} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-medium">
        {title}
        <span className="ml-2 text-xs text-muted">({count})</span>
      </h2>
      {children}
    </section>
  );
}

function JsonList({ data }: { data: unknown[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-muted">暂无数据</p>;
  }
  return (
    <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
      {data.slice(0, 20).map((row, i) => (
        <li key={i} className="rounded-lg bg-surface-muted/50 p-2 font-mono break-all">
          {JSON.stringify(row)}
        </li>
      ))}
    </ul>
  );
}
