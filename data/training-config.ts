import { MODEL, TRAINING_FACTS, type FactValue } from "./model";

/**
 * Presentation grouping for the training configuration.
 *
 * Values are looked up from TRAINING_FACTS by label rather than restated, so
 * this panel and the pipeline table cannot drift apart. A missing label is a
 * test failure, not a silently blank card.
 */
export interface ConfigEntry {
  label: string;
  value: FactValue;
}

export interface ConfigGroup {
  id: string;
  title: string;
  /** One line on what this group buys the engineer. Not a lesson. */
  purpose: string;
  entries: ConfigEntry[];
}

/** Labels this panel depends on. Asserted to exist in TRAINING_FACTS. */
export const REFERENCED_FACT_LABELS = [
  "Quantization",
  "Compute dtype",
  "Gradient checkpointing",
  "LoRA rank",
  "LoRA alpha",
  "Trainable parameters",
  "Epochs",
  "Batch size",
  "Learning rate",
] as const;

function fact(label: string): ConfigEntry {
  const found = TRAINING_FACTS.find((f) => f.label === label);
  if (!found) {
    throw new Error(`Training configuration references an unknown fact: ${label}`);
  }
  return { label: found.label, value: found.value };
}

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: "model-data",
    title: "Model & data",
    purpose:
      "A base checkpoint adapted to follow instructions, using the corpus whose prompt format the runtime reproduces exactly.",
    entries: [
      { label: "Base model", value: MODEL.baseModel },
      { label: "Dataset", value: MODEL.dataset },
      { label: "Fine-tuning", value: MODEL.adapterMethod },
    ],
  },
  {
    id: "memory",
    title: "Memory strategy",
    purpose:
      "QLoRA holds the base read-only in 4-bit NF4 so optimizer state scales with the adapters, not the model. Gradient checkpointing recomputes activations in the backward pass instead of holding them, trading compute for headroom.",
    entries: [fact("Quantization"), fact("Gradient checkpointing")],
  },
  {
    id: "precision",
    title: "Compute precision",
    purpose:
      "Arithmetic runs in BF16 above the quantized weights: it keeps the exponent range of FP32 at half the width, so the step stays numerically stable without loss scaling.",
    entries: [fact("Compute dtype")],
  },
  {
    id: "adapter",
    title: "Adapter capacity",
    purpose:
      "Rank sets how much the adapter can express; alpha scales how strongly it acts on the frozen base. Together they bound how far the model can move, and they are why so few parameters carry the update.",
    entries: [fact("LoRA rank"), fact("LoRA alpha"), fact("Trainable parameters")],
  },
  {
    id: "optimization",
    title: "Optimization",
    purpose: "The recorded schedule for the run that produced the deployed artifact.",
    entries: [fact("Epochs"), fact("Batch size"), fact("Learning rate")],
  },
];
