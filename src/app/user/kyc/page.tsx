"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { KycDiditFlow } from "@/components/user/kyc/kyc-didit-flow";
import { KycStatusOverview, useKycStatusMeta } from "@/components/user/kyc/kyc-status-overview";
import { KycWizard } from "@/components/user/kyc/kyc-wizard";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { KycService } from "@/services/kyc-service";
import { toast } from "@/services/toast";
import { useKycStore } from "@/stores/use-kyc-store";
import { cn } from "@/lib/cn";
import { isChineseLocale } from "@/i18n/locale-helpers";

type PageView = "status" | "verify";

export default function UserKycPage() {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = isChineseLocale(locale);

  const status = useKycStore((s) => s.status);
  const profile = useKycStore((s) => s.profile);
  const submitToServer = useKycStore((s) => s.submitToServer);
  const hydrateFromServer = useKycStore((s) => s.hydrateFromServer);
  const approve = useKycStore((s) => s.approve);
  const reject = useKycStore((s) => s.reject);

  const [view, setView] = useState<PageView>("status");
  const [diditEnabled, setDiditEnabled] = useState(false);
  const [devAutoApprove, setDevAutoApprove] = useState(true);

  useEffect(() => {
    void hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    void KycService.getConfig()
      .then((res) => {
        setDiditEnabled(Boolean(res?.diditEnabled));
        setDevAutoApprove(res?.devAutoApprove !== false);
      })
      .catch(() => {
        setDiditEnabled(false);
        setDevAutoApprove(true);
      });
  }, []);

  const meta = useKycStatusMeta(status, t);
  const StatusIcon =
    status === "verified"
      ? BadgeCheck
      : status === "pending"
        ? Clock3
        : status === "rejected"
          ? XCircle
          : ShieldAlert;

  async function handleWizardComplete(data: {
    idType: import("@/stores/use-kyc-store").KycIdType;
    fullName: string;
    idNumber: string;
    countryIso: string;
    docFrontName: string;
    docBackName?: string;
    address?: string;
    validUntil?: string;
  }) {
    try {
      await submitToServer({
        ...data,
        docUploaded: true,
        docFrontName: data.docFrontName,
        docBackName: data.docBackName,
      });
      setView("status");
      toast.success(devAutoApprove ? t("user.kycAutoApproved") : t("user.kycSubmitted"));
    } catch {
      toast.error(t("user.kycSubmitFailed"));
    }
  }

  async function handleDiditSynced() {
    await hydrateFromServer();
    setView("status");
  }

  const useDidit = diditEnabled;
  const showDemoReview = !useDidit && !devAutoApprove && status === "pending";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("user.kycTitle")}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {useDidit
              ? t("user.kycDiditPageSubtitle")
              : devAutoApprove
                ? t("user.kycDevAutoApproveSubtitle")
                : t("user.kycSubtitle")}
          </p>
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

      {view === "verify" ? (
        useDidit ? (
          <KycDiditFlow
            onSynced={() => void handleDiditSynced()}
            onCancel={() => setView("status")}
          />
        ) : (
          <KycWizard
            autoApprove={devAutoApprove}
            onComplete={handleWizardComplete}
            onCancel={() => setView("status")}
          />
        )
      ) : (
        <KycStatusOverview
          status={status}
          profile={profile}
          onStart={() => setView("verify")}
          showDemoReview={showDemoReview}
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
