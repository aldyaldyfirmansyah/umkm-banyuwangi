import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold text-primary-deep sm:text-4xl">{title}</h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b bg-hero">
      <div className="leaf-pattern absolute inset-0 opacity-60" aria-hidden />
      <div className="container-page relative py-12 sm:py-16">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold text-primary-deep sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>}
        {children}
      </div>
    </section>
  );
}
