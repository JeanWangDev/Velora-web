import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Headset,
  LayoutDashboard,
  Settings,
  Shield,
} from "lucide-react";

export type UserAccountNavId =
  | "overview"
  | "kyc"
  | "security"
  | "support"
  | "preferences";

export interface UserAccountNavItem {
  id: UserAccountNavId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** 仅 pathname 完全匹配时高亮 */
  exact?: boolean;
  /** 侧栏展示 KYC 状态角标 */
  showKycBadge?: boolean;
}

export const USER_ACCOUNT_NAV: UserAccountNavItem[] = [
  {
    id: "overview",
    href: "/user",
    labelKey: "user.overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "kyc",
    href: "/user/kyc",
    labelKey: "user.kyc",
    icon: BadgeCheck,
    showKycBadge: true,
  },
  {
    id: "security",
    href: "/user/security",
    labelKey: "user.security",
    icon: Shield,
  },
  {
    id: "support",
    href: "/user/support",
    labelKey: "user.support",
    icon: Headset,
  },
  {
    id: "preferences",
    href: "/user/preferences",
    labelKey: "user.preferences",
    icon: Settings,
  },
];

export function isUserAccountNavActive(
  pathname: string,
  item: UserAccountNavItem,
): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const href = item.href.replace(/\/$/, "") || "/";
  if (item.exact) return normalized === href;
  return normalized === href || normalized.startsWith(`${href}/`);
}
