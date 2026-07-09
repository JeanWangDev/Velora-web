"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  KycService,
  type ServerKycVerification,
} from "@/services/kyc-service";

export type KycStatus = "none" | "pending" | "verified" | "rejected";

export type KycIdType = "id_card" | "passport";

export interface KycProfile {
  fullName: string;
  idType: KycIdType;
  idNumber: string;
  countryIso: string;
  /** 人像面 / 护照页文件名（演示） */
  docFrontName?: string;
  /** 国徽面文件名（身份证） */
  docBackName?: string;
  /** @deprecated 兼容旧数据 */
  docUploaded: boolean;
  /** 有效期至 YYYY-MM-DD */
  validUntil?: string;
  address?: string;
  submittedAt?: number;
  reviewedAt?: number;
  rejectReason?: string;
}

interface KycState {
  status: KycStatus;
  profile: KycProfile | null;
  /** 是否已从服务端同步过一次 */
  hydrated: boolean;
  submit: (profile: KycProfile) => void;
  /** 从后端同步 KYC 状态（登录后调用） */
  hydrateFromServer: () => Promise<void>;
  /** 提交到后端；失败时回退为本地演示态 */
  submitToServer: (profile: KycProfile) => Promise<void>;
  /** 演示：审核通过 */
  approve: () => void;
  reject: (reason: string) => void;
  reset: () => void;
}

const empty: Pick<KycState, "status" | "profile"> = {
  status: "none",
  profile: null,
};

function mapServerToState(
  server: ServerKycVerification | null,
): Pick<KycState, "status" | "profile"> {
  if (!server) {
    return { status: "none", profile: null };
  }
  return {
    status: server.status,
    profile: {
      fullName: server.fullName,
      idType: server.idType,
      idNumber: server.idNumber,
      countryIso: server.countryIso,
      docFrontName: server.docFrontName ?? undefined,
      docBackName: server.docBackName ?? undefined,
      docUploaded: Boolean(server.docFrontName),
      validUntil: server.validUntil ?? undefined,
      address: server.address ?? undefined,
      submittedAt: server.submittedAt ?? undefined,
      reviewedAt: server.reviewedAt ?? undefined,
      rejectReason: server.rejectReason ?? undefined,
    },
  };
}

function isDiditPlaceholder(kyc: ServerKycVerification): boolean {
  return kyc.fullName === "—" || kyc.idNumber === "—";
}

export const useKycStore = create<KycState>()(
  persist(
    (set, get) => ({
      ...empty,
      hydrated: false,
      submit: (profile) =>
        set({
          status: "pending",
          profile: {
            ...profile,
            submittedAt: Date.now(),
            reviewedAt: undefined,
            rejectReason: undefined,
          },
        }),
      hydrateFromServer: async () => {
        try {
          const res = await KycService.getMine();
          let kyc = res?.kyc ?? null;

          if (
            kyc?.status === "pending" &&
            kyc.diditSessionId &&
            isDiditPlaceholder(kyc)
          ) {
            try {
              const synced = await KycService.syncDidit(kyc.diditSessionId);
              kyc = synced.kyc;
            } catch {
              // 保留 pending 占位态，用户可稍后刷新
            }
          }

          set({ ...mapServerToState(kyc), hydrated: true });
        } catch {
          // 后端不可用 / 未登录：保留本地演示态
          set({ hydrated: true });
        }
      },
      submitToServer: async (profile) => {
        try {
          const res = await KycService.submit({
            idType: profile.idType,
            fullName: profile.fullName,
            idNumber: profile.idNumber,
            countryIso: profile.countryIso,
            address: profile.address,
            validUntil: profile.validUntil,
            docFrontName: profile.docFrontName,
            docBackName: profile.docBackName,
          });
          set({ ...mapServerToState(res.kyc), hydrated: true });
        } catch {
          // 回退为本地演示态，保证无后端时流程可走通
          get().submit(profile);
        }
      },
      approve: () => {
        const profile = get().profile;
        if (!profile) return;
        set({
          status: "verified",
          profile: { ...profile, reviewedAt: Date.now(), rejectReason: undefined },
        });
      },
      reject: (reason) => {
        const profile = get().profile;
        if (!profile) return;
        set({
          status: "rejected",
          profile: { ...profile, reviewedAt: Date.now(), rejectReason: reason },
        });
      },
      reset: () => set({ ...empty }),
    }),
    {
      name: "velora-kyc",
      partialize: (state) => ({ status: state.status, profile: state.profile }),
    },
  ),
);

export function isKycVerified(status: KycStatus): boolean {
  return status === "verified";
}
