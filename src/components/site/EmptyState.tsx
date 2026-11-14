import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        {icon ?? <PackageOpen className="size-7" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
