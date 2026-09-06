/**
 * The model-development flow, as it ran. This is a description of training
 * that already happened on SageMaker -- it is not a runtime path, and nothing
 * here executes in the browser.
 */
export type NodeKind = "data" | "model" | "frozen" | "trainable" | "compute" | "artifact";

export interface TrainingNode {
  id: string;
  label: string;
  sublabel: string;
  kind: NodeKind;
}

/** Order is fixed and asserted in tests. */
export const TRAINING_NODES: TrainingNode[] = [
  { id: "dataset", label: "Dolly 15K", sublabel: "instruction · context · response", kind: "data" },
  { id: "tokenization", label: "Tokenization", sublabel: "prompt template applied", kind: "data" },
  { id: "base-model", label: "Mixtral-8x7B-v0.1", sublabel: "sparse MoE base", kind: "model" },
  { id: "quantization", label: "4-bit NF4 quantization", sublabel: "bitsandbytes", kind: "model" },
  { id: "frozen-base", label: "Frozen base weights", sublabel: "no gradient · no update", kind: "frozen" },
  { id: "lora-adapters", label: "LoRA adapters A / B", sublabel: "rank 64 · alpha 16", kind: "trainable" },
  { id: "forward", label: "Forward pass", sublabel: "BF16 compute", kind: "compute" },
  { id: "loss", label: "Loss", sublabel: "next-token objective", kind: "compute" },
  { id: "backprop", label: "Backpropagation", sublabel: "BF16 compute", kind: "compute" },
  { id: "update", label: "Update LoRA adapters only", sublabel: "~3.96% of parameters", kind: "trainable" },
  { id: "artifact", label: "Trained artifact", sublabel: "adapter + config", kind: "artifact" },
  { id: "deployment", label: "SageMaker deployment", sublabel: "hosted endpoint", kind: "artifact" },
];

export const TRAINING_LEGEND: Array<{ kind: NodeKind; label: string; note: string }> = [
  { kind: "frozen", label: "Frozen", note: "quantized Mixtral base · receives no updates" },
  { kind: "trainable", label: "Trainable", note: "LoRA A/B adapters · gradients applied here" },
  { kind: "compute", label: "Compute", note: "BF16 where applicable" },
];

export const TRAINING_DISCLAIMER =
  "Illustrates the training loop as it ran on SageMaker. No training runs in this browser, and no figure here is a measurement.";
