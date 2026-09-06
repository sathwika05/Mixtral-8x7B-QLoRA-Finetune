import { formatFact } from "@/data/model";
import { CONFIG_GROUPS, type ConfigEntry } from "@/data/training-config";
import { cn } from "@/lib/utils";

function Row({ entry }: { entry: ConfigEntry }) {
  const formatted = formatFact(entry.value);
  const missing = formatted === "Not recorded";

  return (
    <div
      data-testid="config-row"
      className="flex items-baseline justify-between gap-4 py-1.5"
    >
      <span className="text-xs text-foreground/80">{entry.label}</span>
      <span
        className={cn(
          "num text-sm",
          missing ? "italic text-muted-foreground" : "text-foreground",
        )}
      >
        {formatted}
      </span>
    </div>
  );
}

export function TrainingConfig() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CONFIG_GROUPS.map((group) => (
          <section
            key={group.id}
            data-testid="config-group"
            className="flex flex-col border border-border bg-card"
          >
            <header className="border-b border-border px-4 py-2.5">
              <h3 className="num text-[11px] uppercase tracking-wider text-foreground">
                {group.title}
              </h3>
            </header>

            <div className="flex flex-col px-4 py-2">
              {group.entries.map((entry) => (
                <Row key={entry.label} entry={entry} />
              ))}
            </div>

            <p className="mt-auto border-t border-border px-4 py-3 text-xs leading-relaxed text-foreground/80">
              {group.purpose}
            </p>
          </section>
        ))}
      </div>

    </div>
  );
}
