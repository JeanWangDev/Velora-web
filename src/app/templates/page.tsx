import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TemplatesPageClient } from "@/app/templates/_components/templates-page-client";

function TemplatesLoading() {
  return (
    <div className="flex justify-center py-16 text-muted">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<TemplatesLoading />}>
        <TemplatesPageClient />
      </Suspense>
    </section>
  );
}
