"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";

export default function TermsPage() {
  const t = useExchangeT();
  const locale = useLocale();

  const sections =
    locale === "zh"
      ? [
          {
            title: "1. 服务说明",
            body: "Velora 提供数字资产现货交易及相关信息服务。内测阶段使用模拟资产，不构成真实资金托管。",
          },
          {
            title: "2. 用户义务",
            body: "您应遵守所在地法律法规，不得利用平台从事洗钱、欺诈等违法活动。",
          },
          {
            title: "3. 免责声明",
            body: "数字资产价格波动剧烈，交易风险由用户自行承担。平台不对因网络、系统维护等导致的服务中断承担责任。",
          },
        ]
      : [
          {
            title: "1. Service",
            body: "Velora provides spot trading and market data. Internal beta uses simulated assets only.",
          },
          {
            title: "2. User obligations",
            body: "You must comply with applicable laws and must not use the platform for illegal activities.",
          },
          {
            title: "3. Disclaimer",
            body: "Crypto assets are volatile. Trading risk is borne by the user. Velora is not liable for outages due to maintenance or network issues.",
          },
        ];

  return (
    <div className="aurora-bg mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("legal.terms")}
      </h1>

      <div className="glass-panel space-y-6 rounded-2xl p-6 sm:p-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-medium">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
