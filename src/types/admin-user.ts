import type { RoleKey } from "@/types/auth";

export type AdminUser = {
  id: number;
  email: string;
  nickname: string;
  status: number;
  roleKey: RoleKey;
  roleName: string;
  roleLevel: number;
  lastLoginTime: number | null;
  createdAt: number;
  updatedAt: number;
};
