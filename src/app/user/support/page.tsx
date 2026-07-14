"use client";

import { useEffect, useState } from "react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { SupportService, type SupportTicket } from "@/services/support-service";
import { formatDateTime } from "@/utils/format-exchange";
import { toast } from "@/services/toast";
import { isChineseLocale } from "@/i18n/locale-helpers";

export default function UserSupportPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = isChineseLocale(locale);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    void SupportService.list()
      .then((res) => setTickets(res.data ?? []))
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error(isZh ? "请填写主题和内容" : "Subject and body required");
      return;
    }
    setSubmitting(true);
    try {
      await SupportService.create({ category, subject, body });
      setSubject("");
      setBody("");
      toast.success(isZh ? "工单已提交" : "Ticket submitted");
      load();
    } catch {
      toast.error(isZh ? "提交失败" : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isZh ? "帮助与客服" : "Support"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isZh ? "提交工单，我们会尽快回复" : "Submit a ticket and we will reply soon"}
        </p>
      </div>

      <section className="glass-panel space-y-3 rounded-2xl p-5">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="general">{isZh ? "综合咨询" : "General"}</option>
          <option value="deposit">{isZh ? "充值问题" : "Deposit"}</option>
          <option value="withdraw">{isZh ? "提现问题" : "Withdraw"}</option>
          <option value="trade">{isZh ? "交易问题" : "Trading"}</option>
          <option value="security">{isZh ? "安全问题" : "Security"}</option>
        </select>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={isZh ? "主题" : "Subject"}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isZh ? "详细描述" : "Details"}
          rows={5}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isZh ? "提交工单" : "Submit ticket"}
        </button>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-medium">
          {isZh ? "我的工单" : "My tickets"}
        </h2>
        <ul className="divide-y divide-border/60">
          {tickets.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">{t("common.noData")}</li>
          ) : (
            tickets.map((tk) => (
              <li key={tk.ticketNo} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{tk.subject}</p>
                  <span className="text-xs text-muted">
                    {tk.status} · {formatDateTime(tk.createdAt, locale)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-2">{tk.body}</p>
                {tk.adminReply ? (
                  <p className="mt-2 rounded bg-primary/10 px-2 py-1.5 text-xs">
                    {isZh ? "客服回复：" : "Reply: "}
                    {tk.adminReply}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
