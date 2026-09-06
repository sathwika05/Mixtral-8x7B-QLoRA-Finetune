import { LIFECYCLE_STAGES } from "@/data/lifecycle";

/**
 * The model-development lifecycle. Static and historical: it takes no props,
 * so no request state can ever animate it.
 */
export function LifecycleTrack() {
  return (
    <ol className="flex flex-wrap items-stretch gap-1.5">
      {LIFECYCLE_STAGES.map((stage, index) => (
        <li key={stage.id} className="flex items-center gap-1.5">
          <div className="min-w-[8.5rem] border border-border bg-muted px-3 py-2">
            <div className="num text-[10px] text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="num text-[11px] font-medium text-foreground">
              {stage.title}
            </div>
            <div className="text-[10px] text-muted-foreground">{stage.role}</div>
          </div>
          {index < LIFECYCLE_STAGES.length - 1 ? (
            <span aria-hidden className="num text-[10px] text-muted-foreground">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
