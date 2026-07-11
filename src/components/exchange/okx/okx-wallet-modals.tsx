"use client";

import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useRequireKyc } from "@/hooks/use-require-kyc";
import { WalletService } from "@/services/wallet-service";
import { useTradingStore } from "@/stores/use-trading-store";
import type { AccountType } from "@/types/exchange";
import { toast } from "@/services/toast";
import { cn } from "@/lib/cn";

const ACCOUNT_LABELS: Record<AccountType, { zh: string; en: string }> = {
  funding: { zh: "资金账户", en: "Funding" },
  trading: { zh: "交易账户", en: "Trading" },
  futures: { zh: "合约账户", en: "Futures" },
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--terminal-border)] bg-[var(--terminal-panel)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--terminal-border)] px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function DepositModal({
  open,
  onClose,
  defaultCurrency = "USDT",
}: {
  open: boolean;
  onClose: () => void;
  defaultCurrency?: string;
}) {
  const t = useExchangeT();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [chain, setChain] = useState("TRC20");
  const [chains, setChains] = useState<Record<string, string[]>>({});
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    void WalletService.getChains().then((res) => {
      const c = res.chains ?? {};
      setChains(c);
      const list = c[currency] ?? ["TRC20"];
      setChain(list[0] ?? "TRC20");
    });
  }, [open, currency]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void WalletService.getDepositAddress(currency, chain)
      .then((res) => {
        setAddress(res.address);
        setMemo(res.memo);
      })
      .catch(() => toast.error("获取充币地址失败"))
      .finally(() => setLoading(false));
  }, [open, currency, chain]);

  if (!open) return null;

  const chainList = chains[currency] ?? ["TRC20"];

  return (
    <ModalShell title={t("assets.deposit")} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div>
          <label className="text-xs text-muted">币种</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2"
          >
            {["USDT", "BTC", "ETH", "BNB"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted">网络</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {chainList.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChain(c)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs",
                  chain === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[var(--terminal-border)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--terminal-border)] bg-[var(--terminal-bg)] p-3">
          <p className="text-xs text-muted">充币地址（入账至资金账户）</p>
          <p className="mt-2 break-all font-mono text-xs">
            {loading ? "…" : address || "—"}
          </p>
          {memo ? <p className="mt-1 text-xs text-muted">Memo: {memo}</p> : null}
          {address ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
              onClick={() => {
                void navigator.clipboard.writeText(address);
                toast.success("已复制");
              }}
            >
              <Copy className="h-3 w-3" /> 复制地址
            </button>
          ) : null}
        </div>
        <p className="text-[11px] leading-relaxed text-muted">
          请勿向上述地址充值非 {currency}-{chain} 资产，否则资产将不可找回。区块确认后自动入账资金账户。
        </p>
      </div>
    </ModalShell>
  );
}

export function WithdrawModal({
  open,
  onClose,
  defaultCurrency = "USDT",
}: {
  open: boolean;
  onClose: () => void;
  defaultCurrency?: string;
}) {
  const t = useExchangeT();
  const { ensureKyc } = useRequireKyc();
  const balances = useTradingStore((s) => s.getAccountBalances("funding"));
  const refresh = useTradingStore((s) => s.refreshBalances);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [chain, setChain] = useState("TRC20");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avail = balances.find((b) => b.currency === currency)?.available ?? 0;

  if (!open) return null;

  const submit = async () => {
    if (!ensureKyc()) return;
    const val = Number(amount);
    if (!(val > 0) || !address.trim()) {
      toast.error("请填写有效金额和地址");
      return;
    }
    setSubmitting(true);
    try {
      await WalletService.withdraw({
        currency,
        chain,
        amount: val,
        address: address.trim(),
      });
      toast.success("提现申请已提交，等待审核");
      void refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提现失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={t("assets.withdraw")} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p className="text-xs text-muted">
          可用（资金账户）：{avail} {currency}
        </p>
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          placeholder="币种"
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2"
        />
        <input
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          placeholder="网络 TRC20 / ERC20"
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="提现数量"
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2 font-mono"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="提现地址"
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2 font-mono text-xs"
        />
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "提交中…" : "提交提现"}
        </button>
      </div>
    </ModalShell>
  );
}

export function TransferModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const refresh = useTradingStore((s) => s.refreshBalances);
  const getBalances = useTradingStore((s) => s.getAccountBalances);
  const [from, setFrom] = useState<AccountType>("funding");
  const [to, setTo] = useState<AccountType>("trading");
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avail = getBalances(from).find((b) => b.currency === currency)?.available ?? 0;

  if (!open) return null;

  const submit = async () => {
    const val = Number(amount);
    if (!(val > 0)) {
      toast.error("请输入有效金额");
      return;
    }
    if (from === to) {
      toast.error("账户不能相同");
      return;
    }
    setSubmitting(true);
    try {
      await WalletService.transfer({ currency, amount: val, fromAccount: from, toAccount: to });
      toast.success("划转成功");
      void refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "划转失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="资金划转" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted">从</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as AccountType)}
              className="mt-1 w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-2 text-xs"
            >
              {(Object.keys(ACCOUNT_LABELS) as AccountType[]).map((k) => (
                <option key={k} value={k}>
                  {ACCOUNT_LABELS[k].zh}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">到</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as AccountType)}
              className="mt-1 w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-2 py-2 text-xs"
            >
              {(Object.keys(ACCOUNT_LABELS) as AccountType[]).map((k) => (
                <option key={k} value={k}>
                  {ACCOUNT_LABELS[k].zh}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted">
          可用：{avail} {currency}
        </p>
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="划转数量"
          className="w-full rounded-md border border-[var(--terminal-border)] bg-[var(--terminal-bg)] px-3 py-2 font-mono"
        />
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "处理中…" : "确认划转"}
        </button>
      </div>
    </ModalShell>
  );
}
