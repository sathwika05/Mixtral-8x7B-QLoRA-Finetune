"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EvidenceItem } from "@/data/evidence";

/** Sits inside a Panel; the picture carries the only border. */
export function EvidenceCard({
  item,
  available,
}: {
  item: EvidenceItem;
  available: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      data-testid="evidence-card"
      data-available={available}
      className="flex flex-col gap-3"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-[11px] text-muted-foreground">{item.title}</span>
        <span className="num text-base text-signal-ok">{item.statedFact}</span>
      </figcaption>

      {available ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.file}
          alt={item.alt}
          className="w-full rounded-[3px] border border-border"
          loading="lazy"
        />
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-[3px] border border-dashed border-border bg-muted px-4 py-6 text-center">
          <span className="text-[11px] text-muted-foreground">
            Screenshot not provided
          </span>
          <span className="num text-[10px] text-muted-foreground">
            expected at public{item.file}
          </span>
        </div>
      )}

      {item.caption ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {item.caption}
        </p>
      ) : null}
    </motion.figure>
  );
}
