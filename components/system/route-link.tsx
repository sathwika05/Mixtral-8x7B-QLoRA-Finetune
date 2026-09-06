import Link from "next/link";

/** A full-width link into another route, styled as a panel rather than a button. */
export function RouteLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="num flex items-baseline justify-between gap-4 border border-border bg-card px-4 py-3 text-[11px] text-foreground/80 transition-colors hover:border-border-strong hover:text-foreground"
    >
      <span className="uppercase tracking-wider">{label}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
