import type { KycIdType } from "@/stores/use-kyc-store";

export interface KycOcrResult {
  fullName: string;
  idNumber: string;
  countryIso: string;
  /** 身份证地址（演示） */
  address?: string;
  /** 有效期至 YYYY-MM-DD */
  validUntil?: string;
  /** 0–1 */
  confidence: number;
}

export type KycOcrPhase =
  | "detecting"
  | "reading"
  | "validating"
  | "done";

const OCR_PHASES: KycOcrPhase[] = ["detecting", "reading", "validating", "done"];

export function getOcrPhases(): KycOcrPhase[] {
  return OCR_PHASES;
}

/** 18 位身份证校验码 */
function cnIdCheckDigit(body17: string): string {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = "10X98765432";
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += Number(body17[i]) * weights[i];
  }
  return codes[sum % 11];
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mockCnIdNumber(seed: string): string {
  const h = hashSeed(seed);
  const area = String(110000 + (h % 9000)).padStart(6, "0").slice(0, 6);
  const birth = "19930317";
  const seq = String(100 + (h % 899)).padStart(3, "0");
  const body17 = `${area}${birth}${seq}`;
  return body17 + cnIdCheckDigit(body17);
}

function mockPassportNumber(seed: string): string {
  const h = hashSeed(seed);
  return `E${String(10000000 + (h % 89999999))}`;
}

function deriveFullName(hint?: { nickname?: string; email?: string }): string {
  const nick = hint?.nickname?.trim();
  if (nick && /[\u4e00-\u9fa5]/.test(nick)) return nick;
  if (nick && nick.length >= 2) return nick;
  const local = hint?.email?.split("@")[0] ?? "";
  if (/[\u4e00-\u9fa5]/.test(local)) return local;
  return "张三";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 模拟 OKX / 第三方 KYC OCR 流程。
 * 生产环境应替换为服务端调用（Sumsub、Jumio、阿里云 OCR 等）。
 */
export async function recognizeIdDocument(
  input: {
    idType: KycIdType;
    frontFileName: string;
    backFileName?: string;
    userHint?: { nickname?: string; email?: string };
  },
  onPhase?: (phase: KycOcrPhase) => void,
): Promise<KycOcrResult> {
  const seed = `${input.frontFileName}|${input.backFileName ?? ""}|${input.idType}`;

  if (onPhase) {
    onPhase("detecting");
    await delay(900);
    onPhase("reading");
    await delay(1100);
    onPhase("validating");
    await delay(800);
    onPhase("done");
  }

  const fullName = deriveFullName(input.userHint);
  const countryIso = input.idType === "id_card" ? "CN" : "CN";

  if (input.idType === "passport") {
    return {
      fullName,
      idNumber: mockPassportNumber(seed),
      countryIso,
      validUntil: "2034-12-31",
      confidence: 0.94,
    };
  }

  return {
    fullName,
    idNumber: mockCnIdNumber(seed),
    countryIso,
    address: "北京市朝阳区建国路 88 号",
    validUntil: "2034-03-17",
    confidence: 0.96,
  };
}
