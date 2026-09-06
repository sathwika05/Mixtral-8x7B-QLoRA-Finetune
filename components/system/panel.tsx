import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
          <h2 className="num text-[11px] uppercase tracking-wider text-primary/75">
            {title}
          </h2>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
