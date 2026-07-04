"use client";

import { useRouter } from "next/navigation";
import { RegisterKycModal } from "@/components/auth/register-kyc-modal";
import { useLocaleHref } from "@/i18n/locale-path";

export default function RegisterPage() {
  const router = useRouter();
  const localeHref = useLocaleHref();

  return (
    <RegisterKycModal
      open
      variant="page"
      onClose={() => router.push(localeHref("/login"))}
      onGoLogin={() => router.push(localeHref("/login"))}
    />
  );
}
