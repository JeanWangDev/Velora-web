"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";

const links: {
  href: string;
  labelKey?:
    | "site.adminSymbols"
    | "site.adminUsers"
    | "site.adminFinance"
    | "site.adminOrders"
    | "site.adminKyc";
  label?: string;
}[] = [
  { href: "/admin/symbols", labelKey: "site.adminSymbols" },
  { href: "/admin/users", labelKey: "site.adminUsers" },
  { href: "/admin/finance", labelKey: "site.adminFinance" },
  { href: "/admin/withdrawals", label: "提现审核" },
  { href: "/admin/orders", labelKey: "site.adminOrders" },
  { href: "/admin/kyc", labelKey: "site.adminKyc" },
  { href: "/admin/platform", label: "平台运维" },
];

export function AdminNav() {
  const t = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {links.map((link) => {
        const active = pathname === link.href;
        const label = link.label ?? (link.labelKey ? t(link.labelKey) : link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition lg:w-full lg:shrink",
              active
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
