"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocaleHref } from "@/i18n/locale-path";
import { toast } from "@/services/toast";
import { isKycVerified, useKycStore } from "@/stores/use-kyc-store";

/** 敏感操作前校验 KYC；未通过则提示并跳转认证页 */
export function useRequireKyc() {
  const t = useExchangeT();
  const router = useRouter();
  const localeHref = useLocaleHref();
  const status = useKycStore((s) => s.status);

  const ensureKyc = useCallback(
    (message?: string): boolean => {
      if (isKycVerified(status)) return true;
      toast.info(t("user.kycRequireTitle"), message ?? t("user.kycRequireWithdraw"));
      router.push(localeHref("/user/kyc"));
      return false;
    },
    [localeHref, router, status, t],
  );

  return { status, verified: isKycVerified(status), ensureKyc };
}
