import { formatFact, type FactValue } from "@/data/model";
import { cn } from "@/lib/utils";

export function Metric({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: FactValue;
  unit?: string;
  className?: string;
}) {
  const formatted = formatFact(value);
  const missing = formatted === "Not recorded";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "num text-sm",
            missing ? "italic text-muted-foreground" : "text-foreground",
          )}
        >
          {formatted}
        </span>
        {unit && !missing ? (
          <span className="num text-[11px] text-muted-foreground">{unit}</span>
        ) : null}
      </span>
    </div>
  );
}
