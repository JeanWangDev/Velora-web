"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  submit: (profile: KycProfile) => void;
  /** 演示：审核通过 */
  approve: () => void;
  reject: (reason: string) => void;
  reset: () => void;
}

const empty: Pick<KycState, "status" | "profile"> = {
  status: "none",
  profile: null,
};

export const useKycStore = create<KycState>()(
  persist(
    (set, get) => ({
      ...empty,
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
    { name: "velora-kyc" },
  ),
);

export function isKycVerified(status: KycStatus): boolean {
  return status === "verified";
}
