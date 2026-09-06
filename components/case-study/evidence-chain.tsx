"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EVIDENCE_CHAIN } from "@/data/evidence";
import { cn } from "@/lib/utils";

/**
 * The delivery chain, with the two nodes a console screenshot attests to
 * marked. Reveal is presentational only and conveys no timing.
 */
export function EvidenceChain({ availability }: { availability: Record<string, boolean> }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap items-stretch gap-1.5">
      {EVIDENCE_CHAIN.map((node, index) => {
        const attested = Boolean(node.evidenceId);
        const hasImage = node.evidenceId ? availability[node.evidenceId] : false;

        return (
          <motion.div
            key={node.id}
            className="flex items-center gap-1.5"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
          >
            <div
              data-testid="chain-node"
              data-node={node.id}
              data-attested={attested}
              className={cn(
                "min-w-[9.5rem] border bg-card px-3 py-2",
                attested ? "border-signal-active" : "border-border",
              )}
            >
              <div className="num text-[11px] font-medium text-foreground">{node.label}</div>
              <div className="text-[10px] text-muted-foreground">{node.sublabel}</div>

              {attested ? (
                <div
                  data-testid="attested-marker"
                  className={cn(
                    "num mt-1.5 text-[9px] uppercase tracking-wider",
                    hasImage ? "text-signal-active" : "text-muted-foreground",
                  )}
                >
                  {hasImage ? "console evidence below" : "evidence pending"}
                </div>
              ) : null}
            </div>

            {index < EVIDENCE_CHAIN.length - 1 ? (
              <span aria-hidden className="num text-[10px] text-muted-foreground">
                →
              </span>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
