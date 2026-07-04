/**
 * 多路由共用的「建设中」占位布局（onchain / alert / sentiment / vip / api-docs）。
 * 各路由文案在 `app/<route>/_config/page.ts`，勿把业务文案写在本文件。
 */

interface SectionPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  modules: readonly string[];
}

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  modules,
}: SectionPlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-accent/80">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <div
            key={module}
            className="rounded-3xl border border-border bg-surface p-5 text-sm text-foreground/80"
          >
            {module}
          </div>
        ))}
      </div>
    </section>
  );
}
