"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { useLocale } from "@/i18n/use-translation";
import { PHONE_COUNTRIES } from "@/config/phone-countries";
import { toast } from "@/services/toast";
import { recognizeIdDocument, type KycOcrResult } from "@/services/kyc-ocr-service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { KycIdType } from "@/stores/use-kyc-store";
import {
  KycDocUploadZone,
  KycPrimaryButton,
  KycPrivacyFooter,
  KycWizardBack,
  type UploadedDoc,
} from "@/components/user/kyc/kyc-doc-upload-zone";
import {
  IdCardScanIllustration,
  KycGuideExamples,
} from "@/components/user/kyc/kyc-id-illustrations";
import { KycOcrProcessing } from "@/components/user/kyc/kyc-ocr-processing";
import { cn } from "@/lib/cn";

export type KycWizardStep =
  | "select-type"
  | "guide"
  | "upload-front"
  | "upload-back"
  | "ocr-processing"
  | "personal-info";

interface KycWizardProps {
  onComplete: (data: {
    idType: KycIdType;
    fullName: string;
    idNumber: string;
    countryIso: string;
    docFrontName: string;
    docBackName?: string;
    address?: string;
    validUntil?: string;
  }) => void;
  onCancel: () => void;
  /** 开发阶段：OCR 完成后自动提交并通过 */
  autoApprove?: boolean;
}

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

export function KycWizard({ onComplete, onCancel, autoApprove = false }: KycWizardProps) {
  const t = useExchangeT();
  const locale = useLocale();
  const isZh = locale === "zh";
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<KycWizardStep>("select-type");
  const [idType, setIdType] = useState<KycIdType>("id_card");
  const [frontDoc, setFrontDoc] = useState<UploadedDoc | null>(null);
  const [backDoc, setBackDoc] = useState<UploadedDoc | null>(null);
  const [ocrResult, setOcrResult] = useState<KycOcrResult | null>(null);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [countryIso, setCountryIso] = useState("CN");
  const [address, setAddress] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const startOcr = useCallback(() => {
    setStep("ocr-processing");
  }, []);

  const runOcr = useCallback(
    (onPhase: Parameters<typeof recognizeIdDocument>[1]) =>
      recognizeIdDocument(
        {
          idType,
          frontFileName: frontDoc!.name,
          backFileName: backDoc?.name,
          userHint: user
            ? { nickname: user.nickname, email: user.email }
            : undefined,
        },
        onPhase,
      ),
    [idType, frontDoc, backDoc, user],
  );

  const applyOcrResult = useCallback(
    (result: KycOcrResult) => {
      setOcrResult(result);
      setFullName(result.fullName);
      setIdNumber(result.idNumber);
      setCountryIso(result.countryIso);
      setAddress(result.address ?? "");
      setValidUntil(result.validUntil ?? "");

      if (autoApprove && frontDoc) {
        onComplete({
          idType,
          fullName: result.fullName,
          idNumber: result.idNumber,
          countryIso: result.countryIso,
          docFrontName: frontDoc.uploadedUrl ?? frontDoc.name,
          docBackName: backDoc?.uploadedUrl ?? backDoc?.name,
          address: result.address,
          validUntil: result.validUntil,
        });
        return;
      }

      setStep("personal-info");
    },
    [autoApprove, frontDoc, backDoc, idType, onComplete],
  );

  const autoSubmitAfterUpload = useCallback(async () => {
    if (!frontDoc || submitting) return;
    setSubmitting(true);
    try {
      const result = await recognizeIdDocument({
        idType,
        frontFileName: frontDoc.name,
        backFileName: backDoc?.name,
        userHint: user ? { nickname: user.nickname, email: user.email } : undefined,
      });
      applyOcrResult(result);
    } catch {
      toast.error(t("user.kycOcrFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [frontDoc, backDoc, idType, user, applyOcrResult, submitting, t]);

  function goBack() {
    switch (step) {
      case "select-type":
        onCancel();
        break;
      case "guide":
        setStep("select-type");
        break;
      case "upload-front":
        setStep(idType === "id_card" ? "guide" : "select-type");
        break;
      case "upload-back":
        setStep("upload-front");
        break;
      case "ocr-processing":
        setStep(idType === "id_card" ? "upload-back" : "upload-front");
        break;
      case "personal-info":
        setStep("ocr-processing");
        break;
    }
  }

  function afterSelectType() {
    if (idType === "id_card") {
      setStep("guide");
    } else {
      setStep("upload-front");
    }
  }

  function afterFront() {
    if (!frontDoc) {
      toast.error(t("user.kycFrontRequired"));
      return;
    }
    if (idType === "id_card") {
      setStep("upload-back");
      return;
    }
    if (autoApprove) {
      void autoSubmitAfterUpload();
      return;
    }
    startOcr();
  }

  function afterBack() {
    if (!backDoc) {
      toast.error(t("user.kycBackRequired"));
      return;
    }
    if (autoApprove) {
      void autoSubmitAfterUpload();
      return;
    }
    startOcr();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = fullName.trim();
    const id = idNumber.trim();
    if (!name) {
      toast.error(t("user.kycNameRequired"));
      return;
    }
    if (!id) {
      toast.error(t("user.kycIdRequired"));
      return;
    }
    if (!frontDoc) {
      toast.error(t("user.kycFrontRequired"));
      return;
    }
    if (idType === "id_card" && !backDoc) {
      toast.error(t("user.kycBackRequired"));
      return;
    }
    onComplete({
      idType,
      fullName: name,
      idNumber: id,
      countryIso,
      docFrontName: frontDoc.uploadedUrl ?? frontDoc.name,
      docBackName: backDoc?.uploadedUrl ?? backDoc?.name,
      address: address.trim() || undefined,
      validUntil: validUntil.trim() || undefined,
    });
  }

  const showBack = step !== "ocr-processing";

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        {showBack ? <KycWizardBack onClick={goBack} /> : null}

        {step === "select-type" ? (
          <SelectTypeStep
            idType={idType}
            onSelect={setIdType}
            onNext={afterSelectType}
          />
        ) : null}

        {step === "guide" ? (
          <GuideStep onStart={() => setStep("upload-front")} />
        ) : null}

        {step === "upload-front" ? (
          <UploadStep
            title={
              idType === "id_card"
                ? t("user.kycUploadFrontTitle")
                : t("user.kycUploadPassportTitle")
            }
            hint={t("user.kycUploadFrontHint")}
            side="front"
            value={frontDoc}
            onChange={(doc) => {
              setFrontDoc(doc);
              setOcrResult(null);
            }}
            onNext={afterFront}
            nextLabel={submitting ? t("user.kycSubmitting") : t("user.kycNextStep")}
            nextDisabled={submitting}
          />
        ) : null}

        {step === "upload-back" ? (
          <UploadStep
            title={t("user.kycUploadBackTitle")}
            hint={t("user.kycUploadFrontHint")}
            side="back"
            value={backDoc}
            onChange={(doc) => {
              setBackDoc(doc);
              setOcrResult(null);
            }}
            onNext={afterBack}
            nextLabel={submitting ? t("user.kycSubmitting") : t("user.kycNextStep")}
            nextDisabled={submitting}
          />
        ) : null}

        {step === "ocr-processing" && frontDoc ? (
          <KycOcrProcessing
            frontPreview={frontDoc.previewUrl}
            run={runOcr}
            onDone={applyOcrResult}
          />
        ) : null}

        {step === "personal-info" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {t("user.kycPersonalTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {ocrResult ? t("user.kycOcrConfirmHint") : t("user.kycPersonalSubtitle")}
              </p>
              {ocrResult ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {t("user.kycOcrAutoFilled")} ·{" "}
                  {Math.round(ocrResult.confidence * 100)}%
                </p>
              ) : null}
            </div>

            <OcrField label={t("user.kycFullName")} autoFilled={!!ocrResult}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("user.kycFullNamePh")}
                className={fieldClass}
                autoComplete="name"
              />
            </OcrField>

            <OcrField label={t("user.kycIdNumber")} autoFilled={!!ocrResult}>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={t("user.kycIdNumberPh")}
                className={fieldClass}
                autoComplete="off"
              />
            </OcrField>

            {address ? (
              <OcrField label={t("user.kycAddress")} autoFilled={!!ocrResult}>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={fieldClass}
                  readOnly={false}
                />
              </OcrField>
            ) : null}

            {validUntil ? (
              <OcrField label={t("user.kycValidUntil")} autoFilled={!!ocrResult}>
                <input
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={fieldClass}
                />
              </OcrField>
            ) : null}

            <OcrField label={t("user.kycCountry")} autoFilled={!!ocrResult}>
              <select
                value={countryIso}
                onChange={(e) => setCountryIso(e.target.value)}
                className={fieldClass}
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.flag} {isZh ? c.nameZh : c.nameEn}
                  </option>
                ))}
              </select>
            </OcrField>

            <div className="flex gap-2 rounded-xl bg-surface-muted/50 px-3 py-2 text-xs text-muted">
              {frontDoc ? <span>✓ {frontDoc.name}</span> : null}
              {backDoc ? <span>✓ {backDoc.name}</span> : null}
            </div>

            <KycPrimaryButton type="submit">{t("user.kycSubmit")}</KycPrimaryButton>
            <KycPrivacyFooter />
          </form>
        ) : null}
      </div>
    </div>
  );
}

function OcrField({
  label,
  autoFilled,
  children,
}: {
  label: string;
  autoFilled?: boolean;
  children: React.ReactNode;
}) {
  const t = useExchangeT();
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        {label}
        {autoFilled ? (
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
            {t("user.kycOcrAutoFilled")}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function SelectTypeStep({
  idType,
  onSelect,
  onNext,
}: {
  idType: KycIdType;
  onSelect: (v: KycIdType) => void;
  onNext: () => void;
}) {
  const t = useExchangeT();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">{t("user.kycSelectTypeTitle")}</h2>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelect("id_card")}
          className={cn(
            "relative w-full rounded-xl border p-4 text-left transition",
            idType === "id_card"
              ? "border-neutral-900 bg-surface-muted/60 ring-1 ring-neutral-900 dark:border-white dark:ring-white"
              : "border-border bg-surface hover:border-primary/30",
          )}
        >
          <span className="absolute right-3 top-3 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-neutral-900">
            {t("user.kycRecommended")}
          </span>
          <p className="pr-16 font-medium">{t("user.kycIdCardCn")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("user.kycIdCardCnDesc")}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("passport")}
          className={cn(
            "w-full rounded-xl border p-4 text-left transition",
            idType === "passport"
              ? "border-neutral-900 bg-surface-muted/60 ring-1 ring-neutral-900 dark:border-white dark:ring-white"
              : "border-border bg-surface-muted/30 hover:border-primary/30",
          )}
        >
          <p className="font-medium">{t("user.kycPassport")}</p>
        </button>
      </div>

      <KycPrimaryButton onClick={onNext}>{t("user.kycNextStep")}</KycPrimaryButton>
      <KycPrivacyFooter />
    </div>
  );
}

function GuideStep({ onStart }: { onStart: () => void }) {
  const t = useExchangeT();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">{t("user.kycGuideTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("user.kycGuideSubtitle")}</p>
      </div>

      <KycGuideExamples
        labels={{
          example: t("user.kycGuideExample"),
          corners: t("user.kycGuideTipCorners"),
          glare: t("user.kycGuideTipGlare"),
          clear: t("user.kycGuideTipClear"),
        }}
      />

      <KycPrimaryButton onClick={onStart}>{t("user.kycStartVerify")}</KycPrimaryButton>
      <KycPrivacyFooter />
    </div>
  );
}

function UploadStep({
  title,
  hint,
  side,
  value,
  onChange,
  onNext,
  nextLabel,
  nextDisabled = false,
}: {
  title: string;
  hint: string;
  side: "front" | "back";
  value: UploadedDoc | null;
  onChange: (v: UploadedDoc | null) => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <IdCardScanIllustration />
      <div className="text-center sm:text-left">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted">{hint}</p>
      </div>
      <KycDocUploadZone value={value} onChange={onChange} side={side} />
      <KycPrimaryButton disabled={!value || nextDisabled} onClick={onNext}>
        {nextLabel}
      </KycPrimaryButton>
      <KycPrivacyFooter />
    </div>
  );
}
