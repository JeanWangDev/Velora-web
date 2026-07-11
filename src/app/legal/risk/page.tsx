"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { isChineseLocale } from "@/i18n/locale-helpers";

export default function RiskPage() {
  const t = useExchangeT();
  const locale = useLocale();

  const items =
    isChineseLocale(locale)
      ? [
          "数字资产价格高度波动，可能在短时间内出现大幅涨跌。",
          "杠杆与衍生品（若未来开放）将放大盈亏，可能导致全部本金损失。",
          "请仅使用可承受损失的资金参与交易，并充分了解产品机制。",
          "警惕钓鱼网站与诈骗，请通过官方渠道访问 Velora。",
        ]
      : [
          "Digital asset prices are highly volatile.",
          "Leverage and derivatives (if offered later) amplify gains and losses.",
          "Only trade with funds you can afford to lose.",
          "Beware of phishing — always use official Velora channels.",
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
        {t("legal.risk")}
      </h1>

      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
