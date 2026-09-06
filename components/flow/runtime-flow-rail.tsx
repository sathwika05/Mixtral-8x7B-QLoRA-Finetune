"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RUNTIME_NODES } from "@/data/runtime-flow";
import { cn } from "@/lib/utils";

type NodeState = "idle" | "in-flight" | "complete" | "error";

function nodeState(
  active: boolean,
  errored: boolean,
  durationMs: number | null,
): NodeState {
  if (errored) return "error";
  if (active) return "in-flight";
  return durationMs === null ? "idle" : "complete";
}

const BORDER: Record<NodeState, string> = {
  idle: "border-border",
  "in-flight": "border-signal-active",
  complete: "border-signal-ok",
  error: "border-signal-error",
};

const LABEL: Record<NodeState, string> = {
  idle: "text-foreground/80",
  "in-flight": "text-foreground",
  complete: "text-foreground",
  error: "text-signal-error",
};

export function RuntimeFlowRail({
  active,
  durationMs,
  errored = false,
  hopTimings,
}: {
  active: boolean;
  durationMs: number | null;
  errored?: boolean;
  hopTimings?: Record<string, number>;
}) {
  const reduceMotion = useReducedMotion();
  // Identical for every node: the app cannot observe which hop is executing,
  // so the rail must not single one out.
  const state = nodeState(active, errored, durationMs);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
        {RUNTIME_NODES.map((node, index) => (
          <div key={node.id} className="flex items-center gap-1.5">
            <div
              data-testid="runtime-node"
              data-state={state}
              className={cn(
                "relative min-w-[7.5rem] overflow-hidden border bg-card px-3 py-2",
                BORDER[state],
              )}
            >
              <div className={cn("num text-[11px] font-medium", LABEL[state])}>
                {node.label}
              </div>
              <div className="text-[10px] text-foreground/80">{node.sublabel}</div>

              {hopTimings?.[node.id] !== undefined ? (
                <div
                  data-testid="hop-timing"
                  className="num mt-1 text-[10px] text-foreground/80"
                >
                  {hopTimings[node.id]} ms
                </div>
              ) : null}

              {state === "in-flight" && !reduceMotion ? (
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px bg-signal-active"
                  initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    // Stagger conveys direction of travel only. It is not a
                    // duration estimate for any hop.
                    delay: index * 0.08,
                  }}
                />
              ) : null}
            </div>

            {index < RUNTIME_NODES.length - 1 ? (
              <span aria-hidden className="num text-[10px] text-muted-foreground">
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        {durationMs !== null ? (
          <span className="flex items-baseline gap-1.5">
            <span data-testid="round-trip" className="num text-sm text-foreground">
              {durationMs}
            </span>
            <span className="num text-[11px] text-foreground/80">
              ms total round-trip
            </span>
          </span>
        ) : errored || active ? (
          <span
            className={cn(
              "num text-[11px]",
              errored ? "text-signal-error" : "text-foreground/80",
            )}
          >
            {/* An errored request did happen; saying otherwise contradicts the rail. */}
            {errored ? "Request failed before a round-trip was recorded" : "Request in flight"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
