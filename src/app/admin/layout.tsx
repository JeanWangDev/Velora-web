import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SidebarShellLayout } from "@/components/layout/sidebar-shell-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarShellLayout sidebarTitle="管理后台" sidebar={<AdminNav />}>
      {children}
    </SidebarShellLayout>
  );
}
