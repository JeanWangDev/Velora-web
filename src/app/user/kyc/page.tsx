"use client";

import { useState } from "react";
import { BadgeCheck, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { KycStatusOverview, useKycStatusMeta } from "@/components/user/kyc/kyc-status-overview";
import { KycWizard } from "@/components/user/kyc/kyc-wizard";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import { useKycStore } from "@/stores/use-kyc-store";
import { cn } from "@/lib/cn";

type PageView = "status" | "wizard";

export default function UserKycPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = locale === "zh";

  const status = useKycStore((s) => s.status);
  const profile = useKycStore((s) => s.profile);
  const submit = useKycStore((s) => s.submit);
  const approve = useKycStore((s) => s.approve);
  const reject = useKycStore((s) => s.reject);

  const [view, setView] = useState<PageView>("status");

  const meta = useKycStatusMeta(status, t);
  const StatusIcon =
    status === "verified"
      ? BadgeCheck
      : status === "pending"
        ? Clock3
        : status === "rejected"
          ? XCircle
          : ShieldAlert;

  function handleWizardComplete(data: {
    idType: import("@/stores/use-kyc-store").KycIdType;
    fullName: string;
    idNumber: string;
    countryIso: string;
    docFrontName: string;
    docBackName?: string;
    address?: string;
    validUntil?: string;
  }) {
    submit({
      ...data,
      docUploaded: true,
      docFrontName: data.docFrontName,
      docBackName: data.docBackName,
    });
    setView("status");
    toast.success(t("user.kycSubmitted"));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("user.kycTitle")}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("user.kycSubtitle")}</p>
        </div>
        {view === "status" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              meta.className,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        ) : null}
      </div>

      {view === "wizard" ? (
        <KycWizard
          onComplete={handleWizardComplete}
          onCancel={() => setView("status")}
        />
      ) : (
        <KycStatusOverview
          status={status}
          profile={profile}
          onStart={() => setView("wizard")}
          onApprove={() => {
            approve();
            toast.success(t("user.kycStatusVerified"));
          }}
          onReject={() => {
            reject(isZh ? "证件信息不清晰" : "Document unclear");
            toast.info(t("user.kycStatusRejected"));
          }}
        />
      )}
    </div>
  );
}
