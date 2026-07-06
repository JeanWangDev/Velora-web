import { apiClient } from "@/services/api-client";
import type { KycIdType } from "@/stores/use-kyc-store";

const BASE = "/api/v1/kyc";

export type ServerKycStatus = "pending" | "verified" | "rejected";

export interface ServerKycVerification {
  status: ServerKycStatus;
  idType: KycIdType;
  fullName: string;
  idNumber: string;
  countryIso: string;
  address: string | null;
  validUntil: string | null;
  docFrontName: string | null;
  docBackName: string | null;
  rejectReason: string | null;
  submittedAt: number | null;
  reviewedAt: number | null;
  diditSessionId?: string | null;
}

export interface AdminKycVerification extends ServerKycVerification {
  userId: number;
  email: string | null;
}

export type AdminKycStatusFilter = "pending" | "verified" | "rejected";

export interface SubmitKycPayload {
  idType: KycIdType;
  fullName: string;
  idNumber: string;
  countryIso: string;
  address?: string;
  validUntil?: string;
  docFrontName?: string;
  docBackName?: string;
}

export class KycService {
  static getMine() {
    return apiClient.sendRequest<{ kyc: ServerKycVerification | null }>({
      url: `${BASE}/me`,
      method: "GET",
    });
  }

  static upload(image: string, side: "front" | "back") {
    return apiClient.sendRequest<{ url: string }>({
      url: `${BASE}/upload`,
      method: "POST",
      data: { image, side },
    });
  }

  static submit(payload: SubmitKycPayload) {
    return apiClient.sendRequest<{ kyc: ServerKycVerification }>({
      url: `${BASE}/submit`,
      method: "POST",
      data: payload,
    });
  }

  /** 管理员：分页查询 KYC 列表 */
  static adminList(params?: {
    page?: number;
    pageSize?: number;
    status?: AdminKycStatusFilter;
  }) {
    return apiClient.sendRequest<{
      data: AdminKycVerification[];
      total: number;
      page: number;
      pageSize: number;
    }>({
      url: `${BASE}/admin/list`,
      method: "GET",
      params,
    });
  }

  /** 管理员：审核 KYC */
  static review(userId: number, action: "approve" | "reject", rejectReason?: string) {
    return apiClient.sendRequest<{ kyc: ServerKycVerification }>({
      url: `${BASE}/review`,
      method: "POST",
      data: { userId, action, rejectReason },
    });
  }

  /** Didit 是否已启用 */
  static getDiditConfig() {
    return KycService.getConfig().then((r) => ({ enabled: r.diditEnabled }));
  }

  /** KYC 运行时配置 */
  static getConfig() {
    return apiClient.sendRequest<{ diditEnabled: boolean; devAutoApprove: boolean }>({
      url: `${BASE}/config`,
      method: "GET",
    });
  }

  /** 创建 Didit 验证会话 */
  static createDiditSession(input?: { callbackUrl?: string; language?: string }) {
    return apiClient.sendRequest<{ sessionId: string; url: string }>({
      url: `${BASE}/didit/session`,
      method: "POST",
      data: input ?? {},
    });
  }

  /** 同步 Didit 验证结果 */
  static syncDidit(sessionId: string) {
    return apiClient.sendRequest<{ kyc: ServerKycVerification }>({
      url: `${BASE}/didit/sync`,
      method: "POST",
      data: { sessionId },
    });
  }
}
