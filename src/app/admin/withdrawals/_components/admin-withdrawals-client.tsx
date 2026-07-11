"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminWithdrawService } from "@/services/admin-withdraw-service";
import { toast } from "@/services/toast";

type Row = {
  id: number;
  withdrawNo: string;
  userId: number;
  currency: string;
  chain: string;
  amount: number;
  fee: number;
  address: string;
  status: string;
  ts: number;
};

export function AdminWithdrawalsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminWithdrawService.listPending();
      setRows(res.rows ?? []);
    } catch {
      toast.error("加载提现队列失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (withdrawNo: string) => {
    const txHash = window.prompt("链上 TxHash（可留空由系统生成模拟哈希）") ?? "";
    try {
      await AdminWithdrawService.approve(withdrawNo, txHash || undefined);
      toast.success("已批准提现");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  const reject = async (withdrawNo: string) => {
    const reason = window.prompt("拒绝原因") ?? "审核未通过";
    try {
      await AdminWithdrawService.reject(withdrawNo, reason);
      toast.success("已拒绝并解冻资金");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">提现审核</h1>
      <p className="text-sm text-muted">待处理提现申请，批准后扣除冻结资金；拒绝则原路退回资金账户。</p>
      {loading ? (
        <p className="text-sm text-muted">加载中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">暂无待审核提现</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/60 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 text-left">单号</th>
                <th className="px-3 py-2 text-left">用户</th>
                <th className="px-3 py-2 text-left">币种/链</th>
                <th className="px-3 py-2 text-right">数量</th>
                <th className="px-3 py-2 text-left">地址</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.withdrawNo} className="border-t border-border/60">
                  <td className="px-3 py-2 font-mono text-xs">{r.withdrawNo}</td>
                  <td className="px-3 py-2">{r.userId}</td>
                  <td className="px-3 py-2">
                    {r.amount} {r.currency} · {r.chain}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    费 {r.fee}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">{r.address}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="mr-2 text-primary hover:underline"
                      onClick={() => void approve(r.withdrawNo)}
                    >
                      批准
                    </button>
                    <button
                      type="button"
                      className="text-rose-500 hover:underline"
                      onClick={() => void reject(r.withdrawNo)}
                    >
                      拒绝
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
