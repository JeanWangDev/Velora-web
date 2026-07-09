"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/use-translation";

const links = [
  { href: "/admin/symbols", labelKey: "site.adminSymbols" as const },
  { href: "/admin/users", labelKey: "site.adminUsers" as const },
  { href: "/admin/finance", labelKey: "site.adminFinance" as const },
  { href: "/admin/orders", labelKey: "site.adminOrders" as const },
  { href: "/admin/kyc", labelKey: "site.adminKyc" as const },
];

export function AdminNav() {
  const t = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border pb-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition lg:shrink lg:py-2 ${
              active
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
