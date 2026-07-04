import type { AuthUser } from "@/types/auth";

const ADMIN_ROLE_KEYS = new Set<AuthUser["roleKey"]>(["admin", "super_admin"]);

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (ADMIN_ROLE_KEYS.has(user.roleKey)) return true;
  return typeof user.roleLevel === "number" && user.roleLevel >= 4;
}
