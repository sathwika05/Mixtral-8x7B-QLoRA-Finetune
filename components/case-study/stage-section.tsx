import type { ReactNode } from "react";
import type { CaseStudyStage } from "@/data/case-study";

export function StageSection({
  stage,
  index,
  children,
}: {
  stage: CaseStudyStage;
  index: number;
  children?: ReactNode;
}) {
  return (
    <section
      id={stage.id}
      data-testid="stage-section"
      className="scroll-mt-24 border-t border-border pt-8"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="num text-[11px] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            {stage.title}
          </h2>
        </div>

        <p className="max-w-2xl text-base leading-relaxed text-foreground">{stage.thesis}</p>

        {stage.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 40)}
            className="max-w-2xl text-sm leading-relaxed text-foreground/80"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
