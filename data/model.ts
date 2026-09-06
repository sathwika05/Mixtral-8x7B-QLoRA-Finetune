export type FactValue = string | number | null;

export interface Fact {
  label: string;
  value: FactValue;
  unit?: string;
}

export interface ModelFacts {
  /** The exact display label. The instruction-tuned variant is NOT claimed. */
  label: string;
  baseModel: string;
  architecture: string;
  dataset: string;
  datasetSource: string;
  adapterMethod: string;
}

export const MODEL: ModelFacts = {
  label: "Mixtral-8x7B-v0.1 · QLoRA Fine-Tuned",
  baseModel: "Mixtral-8x7B-v0.1",
  architecture: "Sparse mixture-of-experts, 8 experts",
  dataset: "Databricks Dolly 15K",
  datasetSource: "databricks/databricks-dolly-15k",
  adapterMethod: "QLoRA",
};

/**
 * Owner-supplied training configuration. `null` means the value was never
 * recorded -- it renders as "Not recorded" and is never defaulted.
 */
export const TRAINING_FACTS: Fact[] = [
  { label: "Quantization", value: "4-bit NF4" },
  { label: "Compute dtype", value: "BF16" },
  { label: "Gradient checkpointing", value: "Enabled" },
  { label: "LoRA rank", value: 64 },
  { label: "LoRA alpha", value: 16 },
  { label: "Trainable parameters", value: "~3.96%" },
  { label: "Epochs", value: 2 },
  { label: "Batch size", value: 2 },
  { label: "Learning rate", value: "2e-4" },
  { label: "LoRA dropout", value: null },
  { label: "Target modules", value: null },
  { label: "Max sequence length", value: null },
  { label: "Gradient accumulation steps", value: null },
  { label: "Optimizer", value: null },
  { label: "LR scheduler", value: null },
  { label: "Warmup steps", value: null },
];

export function formatFact(value: FactValue): string {
  if (value === null || value === undefined) return "Not recorded";
  if (typeof value === "string" && value.trim() === "") return "Not recorded";
  return String(value);
}
