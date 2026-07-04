export type PaymentStatus = "pending" | "completed" | "expired" | "cancelled";

export interface MembershipPlan {
  planKey: string;
  name: string;
  description: string;
  priceUsdt: string;
  durationDays: number;
  targetRoleKey: string;
  chain: string;
  asset: string;
}

export interface PaymentOrder {
  orderNo: string;
  planKey: string;
  planName: string;
  durationDays: number | null;
  chain: string;
  asset: string;
  amountUsdt: string;
  depositAddress: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  paymentStatus: PaymentStatus;
  txHash: string | null;
  paidAmountUsdt: string | null;
  expireAt: number;
  paidAt: number | null;
  createdAt: number;
}

export interface UserSubscription {
  planKey: string;
  planName: string;
  status: string;
  startsAt: number;
  endsAt: number;
}
