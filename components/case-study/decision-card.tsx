import type { AnyDecision } from "@/data/case-study";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export function DecisionCard({ decision }: { decision: AnyDecision }) {
  return (
    <article
      data-testid="decision-card"
      className="flex flex-col gap-4 border border-border bg-card p-4"
    >
      <Field label="Decision" value={decision.decision} />
      <Field label="Constraint" value={decision.constraint} />
      <Field label="Trade-off" value={decision.tradeoff} />

      <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-3">
        {decision.recordedAs ? (
          <>
            <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
              Recorded as
            </span>
            <span data-testid="recorded-as" className="num text-[11px] text-foreground">
              {decision.recordedAs}
            </span>
          </>
        ) : (
          <>
            <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
              Enforced by
            </span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {(decision.enforcedBy ?? []).map((path) => (
                <li
                  key={path}
                  data-testid="enforced-by"
                  className="num text-xs text-foreground/80"
                >
                  {path}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}
