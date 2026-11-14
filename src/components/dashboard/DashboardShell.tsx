import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type ShellItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function DashboardShell({ title, subtitle, items, children, banner }: { title: string; subtitle?: string; items: ShellItem[]; children: ReactNode; banner?: ReactNode }) {
  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr] lg:py-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{subtitle}</p>
          <h1 className="font-display text-2xl font-semibold text-primary-deep">{title}</h1>
        </div>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              <it.icon className="size-4" /> {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        {banner}
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-primary-deep sm:text-3xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: { label: string; value: number | string; icon: LucideIcon; tone?: "primary" | "cream" | "warning" | "danger"; hint?: string }) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    cream: "bg-cream text-cream-foreground",
    warning: "bg-warning/25 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${toneClass}`}><Icon className="size-4" /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-primary-deep">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LoadingBlock({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card py-16 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> {label}
    </div>
  );
}
