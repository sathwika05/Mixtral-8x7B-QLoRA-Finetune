import Link from "next/link";
import { MODEL } from "@/data/model";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/inference", label: "Inference" },
  { href: "/case-study", label: "Case Study" },
  { href: "/pipeline", label: "Pipeline" },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-6 py-3">
      <span className="num text-[11px] tracking-wider text-foreground">
        {MODEL.label}
      </span>
      <div className="flex items-center gap-5">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="num text-[11px] uppercase tracking-wider text-foreground/80 transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
