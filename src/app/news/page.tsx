import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { NewsPageClient } from "@/app/news/_components/news-page-client";

function NewsLoading() {
  return (
    <div className="flex justify-center py-16 text-muted">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

export default function NewsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<NewsLoading />}>
        <NewsPageClient />
      </Suspense>
    </section>
  );
}
