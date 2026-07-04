"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/use-translation";

const links = [
  { href: "/admin/symbols", labelKey: "site.adminSymbols" as const },
  { href: "/admin/users", labelKey: "site.adminUsers" as const },
  { href: "/admin/orders", labelKey: "site.adminOrders" as const },
];

export function AdminNav() {
  const t = useTranslation();
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
