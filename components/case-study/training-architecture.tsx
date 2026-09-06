"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  TRAINING_DISCLAIMER,
  TRAINING_LEGEND,
  TRAINING_NODES,
  type NodeKind,
  type TrainingNode,
} from "@/data/training-architecture";

const NODE = Object.fromEntries(TRAINING_NODES.map((n) => [n.id, n])) as Record<
  string,
  TrainingNode
>;

/**
 * Visual encoding, deliberately one accent only:
 *   frozen    solid neutral border, filled  -> cannot change
 *   trainable amber border                  -> gradients land here
 *   compute   dashed neutral border         -> an operation, not a weight store
 */
const STROKE: Record<NodeKind, string> = {
  data: "var(--border-strong)",
  model: "var(--border-strong)",
  frozen: "var(--border-strong)",
  trainable: "var(--signal-active)",
  compute: "var(--border-strong)",
  artifact: "var(--border-strong)",
};

const FILL: Record<NodeKind, string> = {
  data: "var(--card)",
  model: "var(--card)",
  frozen: "var(--muted)",
  trainable: "var(--card)",
  compute: "var(--card)",
  artifact: "var(--card)",
};

const DASH: Partial<Record<NodeKind, string>> = { compute: "3 3" };

function Node({
  id,
  x,
  y,
  w,
  h = 46,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h?: number;
}) {
  const node = NODE[id];
  return (
    <g data-testid="training-node" data-kind={node.kind} data-node={node.id}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={FILL[node.kind]}
        stroke={STROKE[node.kind]}
        strokeDasharray={DASH[node.kind]}
      />
      <text x={x + 12} y={y + 20} fontSize="11" fill="var(--foreground)">
        {node.label}
      </text>
      <text x={x + 12} y={y + 35} fontSize="9" fill="var(--muted-foreground)">
        {node.sublabel}
      </text>
    </g>
  );
}

function BandLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} fontSize="9" letterSpacing="1.4" fill="var(--muted-foreground)">
      {children}
    </text>
  );
}

export function TrainingArchitecture() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { amount: 0.25 });
  // Animation is gated on visibility and on the motion preference: it explains
  // sequence, and it must never suggest work is happening in this browser.
  const animate = !reduceMotion && inView;

  /** Directional flow along a connector. Conveys order, never duration. */
  const flow = (delay: number) =>
    animate
      ? {
          animate: { strokeDashoffset: [12, 0] },
          transition: {
            duration: 1.1,
            repeat: Infinity,
            ease: "linear" as const,
            delay,
          },
        }
      : {};

  const wire = {
    stroke: "var(--border-strong)",
    strokeWidth: 1,
    strokeDasharray: "6 6",
    fill: "none",
  };

  const gradientWire = { ...wire, stroke: "var(--signal-active)" };

  return (
    <figure ref={ref} className="flex flex-col gap-3 border border-border bg-card p-4">
      <svg
        viewBox="0 0 960 470"
        role="img"
        aria-label="QLoRA training architecture. Dolly 15K is tokenized and batched. Mixtral-8x7B-v0.1 is quantized to 4-bit NF4, producing frozen base weights with trainable LoRA A/B adapters attached. Each training step runs a forward pass, computes loss, backpropagates in BF16, and updates the LoRA adapters only; the frozen base receives no updates. The final step yields a trained artifact that is deployed to a SageMaker endpoint."
        className="w-full"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
      >
        <BandLabel x={20} y={26}>INPUT</BandLabel>
        <Node id="dataset" x={20} y={38} w={200} />
        <motion.line x1={220} y1={61} x2={250} y2={61} {...wire} {...flow(0)} />
        <path d="M250 61 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="tokenization" x={256} y={38} w={180} />

        <BandLabel x={20} y={116}>BASE PREPARATION</BandLabel>
        <Node id="base-model" x={20} y={128} w={180} />
        <motion.line x1={200} y1={151} x2={230} y2={151} {...wire} {...flow(0.15)} />
        <path d="M230 151 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="quantization" x={236} y={128} w={200} />
        <motion.line x1={436} y1={151} x2={466} y2={151} {...wire} {...flow(0.3)} />
        <path d="M466 151 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="frozen-base" x={472} y={128} w={180} />

        {/* adapters attach to the frozen base rather than replacing it */}
        <line x1={652} y1={151} x2={694} y2={151} stroke="var(--border-strong)" strokeDasharray="2 3" />
        <text x={656} y={145} fontSize="8" fill="var(--muted-foreground)">attach</text>
        <Node id="lora-adapters" x={700} y={128} w={200} />

        {/* bus: batched data and the assembled model feed each step */}
        <line x1={195} y1={200} x2={938} y2={200} stroke="var(--border-strong)" />
        {/* routed down the right margin so it never crosses a node */}
        <motion.path d="M436 61 L938 61 L938 200" {...wire} {...flow(0.45)} />
        <motion.line x1={562} y1={174} x2={562} y2={200} {...wire} {...flow(0.5)} />
        <motion.line x1={800} y1={174} x2={800} y2={200} {...wire} {...flow(0.55)} />
        <text x={600} y={194} fontSize="8" fill="var(--muted-foreground)">
          batch + assembled model
        </text>
        <motion.line x1={195} y1={200} x2={195} y2={228} {...wire} {...flow(0.6)} />
        <path d="M195 232 l-4 -7 h8 z" fill="var(--border-strong)" />

        <BandLabel x={20} y={222}>TRAINING STEP · BF16 COMPUTATION</BandLabel>
        <Node id="forward" x={120} y={232} w={150} />
        <motion.line x1={270} y1={255} x2={304} y2={255} {...wire} {...flow(0.7)} />
        <path d="M304 255 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="loss" x={310} y={232} w={120} />
        <motion.line x1={430} y1={255} x2={454} y2={255} {...wire} {...flow(0.85)} />
        <path d="M454 255 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="backprop" x={460} y={232} w={180} />

        {/* gradients: the only amber path, and it reaches the adapters alone */}
        <motion.line x1={640} y1={255} x2={674} y2={255} {...gradientWire} {...flow(1)} />
        <path d="M674 255 l-7 -4 v8 z" fill="var(--signal-active)" />
        <text x={642} y={248} fontSize="8" fill="var(--signal-active)">gradients</text>
        <Node id="update" x={680} y={232} w={220} />

        {/* the frozen base is excluded from the update, stated explicitly */}
        <text x={472} y={306} fontSize="9" fill="var(--muted-foreground)">
          frozen base weights receive no update
        </text>

        {/* loop back for the next step */}
        <motion.path
          d="M790 278 L790 330 L195 330 L195 282"
          {...wire}
          {...flow(1.15)}
        />
        <path d="M195 278 l-4 7 h8 z" fill="var(--border-strong)" />
        <text x={430} y={344} fontSize="8" fill="var(--muted-foreground)">next step</text>

        {/* exit once the final step completes */}
        <motion.path d="M880 278 L880 366 L649 366 L649 396" {...wire} {...flow(1.3)} />
        <path d="M649 400 l-4 -7 h8 z" fill="var(--border-strong)" />
        <text x={700} y={362} fontSize="8" fill="var(--muted-foreground)">
          after final step
        </text>

        <BandLabel x={560} y={392}>OUTPUT</BandLabel>
        <Node id="artifact" x={560} y={400} w={170} />
        <motion.line x1={730} y1={423} x2={760} y2={423} {...wire} {...flow(1.45)} />
        <path d="M760 423 l-7 -4 v8 z" fill="var(--border-strong)" />
        <Node id="deployment" x={766} y={400} w={180} />

        {/* legend */}
        <g>
          {TRAINING_LEGEND.map((entry, i) => (
            <g key={entry.kind} data-testid="legend-entry">
              <rect
                x={20}
                y={392 + i * 26}
                width={22}
                height={14}
                fill={FILL[entry.kind]}
                stroke={STROKE[entry.kind]}
                strokeDasharray={DASH[entry.kind]}
              />
              <text x={50} y={403 + i * 26} fontSize="9" fill="var(--foreground)">
                {entry.label}
              </text>
              <text x={110} y={403 + i * 26} fontSize="8" fill="var(--muted-foreground)">
                {entry.note}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <figcaption className="text-[11px] leading-relaxed text-muted-foreground">
        {TRAINING_DISCLAIMER}
      </figcaption>
    </figure>
  );
}
