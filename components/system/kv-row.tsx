import { formatFact, type FactValue } from "@/data/model";
import { cn } from "@/lib/utils";

export function KvRow({ label, value }: { label: string; value: FactValue }) {
  const formatted = formatFact(value);
  const missing = formatted === "Not recorded";

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num text-xs",
          missing ? "italic text-muted-foreground" : "text-foreground",
        )}
      >
        {formatted}
      </span>
    </div>
  );
}
