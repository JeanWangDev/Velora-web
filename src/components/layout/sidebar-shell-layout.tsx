import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SidebarShellLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  /** 侧栏顶部小标题，如「账户中心」「管理后台」 */
  sidebarTitle?: string;
  className?: string;
  mainClassName?: string;
}

/**
 * 标准后台/账户中心布局：侧栏贴左固定宽度，内容区占满右侧剩余空间。
 */
export function SidebarShellLayout({
  children,
  sidebar,
  sidebarTitle,
  className,
  mainClassName,
}: SidebarShellLayoutProps) {
  return (
    <div className={cn("flex w-full min-h-[calc(100vh-3rem)]", className)}>
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto px-3 py-5">
          {sidebarTitle ? (
            <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {sidebarTitle}
            </p>
          ) : null}
          {sidebar}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-surface px-4 py-3 lg:hidden">{sidebar}</div>
        <main className={cn("min-w-0 flex-1 p-4 sm:p-6 lg:p-8", mainClassName)}>{children}</main>
      </div>
    </div>
  );
}
