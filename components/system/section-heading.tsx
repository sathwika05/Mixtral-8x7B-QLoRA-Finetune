export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border pb-4">
      <span className="num text-[11px] uppercase tracking-wider text-signal-ok">
        {eyebrow}
      </span>
      <h1 className="text-lg font-medium tracking-tight text-foreground">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
          {description}
        </p>
      ) : null}
    </div>
  );
}
