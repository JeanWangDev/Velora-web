/** /dashboard 入口；业务见同目录 _components / _types / README.md */
import { DashboardPageClient } from "@/app/dashboard/_components/dashboard-page-client";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageClient />
    </div>
  );
}
