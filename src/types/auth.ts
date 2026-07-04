export type RoleKey =
  | "normal_user"
  | "vip_user"
  | "staff_operator"
  | "admin"
  | "super_admin";

export interface RoleOption {
  roleKey: RoleKey;
  roleName: string;
  roleLevel: number;
}

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  roleKey: RoleKey;
  roleName: string;
  roleLevel: number;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export type AuthModalMode = "login" | "register" | "forgot" | "reset";
