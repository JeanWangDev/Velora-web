"use client";

import {
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExchangeT } from "@/hooks/use-exchange-t";
import type { KycProfile, KycStatus } from "@/stores/use-kyc-store";
import { cn } from "@/lib/cn";

interface KycStatusOverviewProps {
  status: KycStatus;
  profile: KycProfile | null;
  onStart: () => void;
  showDemoReview?: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function KycStatusOverview({
  status,
  profile,
  onStart,
  showDemoReview = false,
  onApprove,
  onReject,
}: KycStatusOverviewProps) {
  const t = useExchangeT();

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-2xl p-5">
        <StatusBlock status={status} profile={profile} />
        {status !== "verified" && status !== "pending" ? (
          <Button className="mt-5" onClick={onStart}>
            {status === "rejected" ? t("user.kycResubmit") : t("user.kycStart")}
          </Button>
        ) : null}
        {status === "pending" && showDemoReview ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onApprove}>
              {t("user.kycDemoApprove")}
            </Button>
            <Button variant="ghost" onClick={onReject}>
              {t("user.kycDemoReject")}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-medium text-muted">{t("user.kycBenefits")}</h2>
        <ul className="space-y-2.5 text-sm">
          {[t("user.kycBenefitWithdraw"), t("user.kycBenefitLimit"), t("user.kycBenefitSecurity")].map(
            (item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ),
          )}
        </ul>
      </section>

      {profile && status !== "none" && !isPlaceholderProfile(profile) ? (
        <section className="glass-panel rounded-2xl p-5 text-sm">
          <h2 className="mb-3 text-sm font-medium text-muted">{t("user.kycTitle")}</h2>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Row label={t("user.kycFullName")} value={profile.fullName} />
            <Row
              label={t("user.kycIdType")}
              value={
                profile.idType === "id_card"
                  ? t("user.kycIdCardCn")
                  : t("user.kycPassport")
              }
            />
            <Row label={t("user.kycIdNumber")} value={maskId(profile.idNumber)} />
            {profile.address ? (
              <Row label={t("user.kycAddress")} value={profile.address} />
            ) : null}
            {profile.validUntil ? (
              <Row label={t("user.kycValidUntil")} value={profile.validUntil} />
            ) : null}
            {profile.docFrontName ? (
              <Row label={t("user.kycUploadFrontTitle")} value={profile.docFrontName} />
            ) : null}
            {profile.docBackName ? (
              <Row label={t("user.kycUploadBackTitle")} value={profile.docBackName} />
            ) : null}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function StatusBlock({
  status,
  profile,
}: {
  status: KycStatus;
  profile: KycProfile | null;
}) {
  const t = useExchangeT();

  const cfg = {
    verified: {
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
      title: t("user.kycStatusVerified"),
      body: t("user.kycVerifiedTip"),
    },
    pending: {
      icon: Clock3,
      tone: "text-amber-600 dark:text-amber-400",
      title: t("user.kycStatusPending"),
      body: t("user.kycPendingTip"),
    },
    rejected: {
      icon: XCircle,
      tone: "text-rose-600 dark:text-rose-400",
      title: t("user.kycStatusRejected"),
      body: profile?.rejectReason
        ? `${t("user.kycRejectedTip")}（${profile.rejectReason}）`
        : t("user.kycRejectedTip"),
    },
    none: {
      icon: ShieldAlert,
      tone: "text-muted",
      title: t("user.kycStatusNone"),
      body: t("user.kycSubtitle"),
    },
  }[status];

  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted",
          cfg.tone,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-medium">{cfg.title}</h2>
        <p className="mt-1 text-sm text-muted">{cfg.body}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function maskId(id: string): string {
  if (id === "—" || id.length <= 4) return "****";
  return `${id.slice(0, 2)}${"*".repeat(Math.min(id.length - 4, 8))}${id.slice(-2)}`;
}

function isPlaceholderProfile(profile: KycProfile): boolean {
  return profile.fullName === "—" || profile.idNumber === "—";
}

export function useKycStatusMeta(status: KycStatus, t: (k: string) => string) {
  const map = {
    verified: {
      label: t("user.kycStatusVerified"),
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    pending: {
      label: t("user.kycStatusPending"),
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    rejected: {
      label: t("user.kycStatusRejected"),
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    none: {
      label: t("user.kycStatusNone"),
      className: "bg-surface-muted text-muted",
    },
  };
  return map[status];
}
