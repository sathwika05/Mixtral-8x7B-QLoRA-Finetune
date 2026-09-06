"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { KvRow } from "@/components/system/kv-row";
import type { LifecycleStage } from "@/data/lifecycle";

export function StageRow({ stage, index }: { stage: LifecycleStage; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-baseline gap-4 px-4 py-3 text-left hover:bg-muted"
      >
        <span className="num w-6 text-[11px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="num min-w-[10rem] text-xs font-medium text-foreground">
          {stage.title}
        </span>
        <span className="flex-1 text-xs text-muted-foreground">{stage.role}</span>
        <span className="num text-[11px] text-muted-foreground">{open ? "−" : "+"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 border-t border-border bg-muted px-4 py-4 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {stage.detail}
                </p>
                <div className="flex flex-col gap-1">
                  <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
                    in
                  </span>
                  <span className="num text-xs text-foreground">
                    {stage.inputArtifact}
                  </span>
                  <span className="num mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    out
                  </span>
                  <span className="num text-xs text-foreground">
                    {stage.outputArtifact}
                  </span>
                </div>
              </div>
              <div>
                {stage.facts.map((fact) => (
                  <KvRow key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
