"use client";

import { useEffect, useState } from "react";
import { CASE_STUDY_STAGES } from "@/data/case-study";
import { cn } from "@/lib/utils";

export function StageIndex() {
  const [active, setActive] = useState(CASE_STUDY_STAGES[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const stage of CASE_STUDY_STAGES) {
      const element = document.getElementById(stage.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Case study stages" className="flex flex-col gap-1">
      {CASE_STUDY_STAGES.map((stage, index) => (
        <a
          key={stage.id}
          href={`#${stage.id}`}
          className={cn(
            "num flex items-baseline gap-2 border-l px-3 py-1 text-[11px] transition-colors",
            active === stage.id
              ? "border-foreground text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="text-[10px]">{String(index + 1).padStart(2, "0")}</span>
          <span>{stage.title}</span>
        </a>
      ))}
    </nav>
  );
}
