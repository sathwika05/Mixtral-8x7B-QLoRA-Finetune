import type { Fact } from "./model";
import { MODEL, TRAINING_FACTS } from "./model";

export interface LifecycleStage {
  id: string;
  title: string;
  /** One line on what this stage did. */
  role: string;
  detail: string;
  inputArtifact: string;
  outputArtifact: string;
  facts: Fact[];
}

function pick(...labels: string[]): Fact[] {
  return TRAINING_FACTS.filter((fact) => labels.includes(fact.label));
}

/**
 * The model-development lifecycle: work that already happened.
 * This sequence is historical and static. It never animates during inference.
 */
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "dataset",
    title: "Dolly 15K",
    role: "Instruction-tuning corpus",
    detail:
      "Databricks Dolly 15K supplies instruction / context / response records. The same template is reproduced at inference time so the prompt matches the training distribution.",
    inputArtifact: "—",
    outputArtifact: "Formatted instruction records",
    facts: [
      { label: "Dataset", value: MODEL.dataset },
      { label: "Source", value: MODEL.datasetSource },
    ],
  },
  {
    id: "base-model",
    title: "Mixtral-8x7B-v0.1",
    role: "Base checkpoint",
    detail:
      "A sparse mixture-of-experts base model. This is the plain pretrained checkpoint, not an instruction-tuned variant.",
    inputArtifact: "—",
    outputArtifact: "Base weights",
    facts: [
      { label: "Base model", value: MODEL.baseModel },
      { label: "Architecture", value: MODEL.architecture },
    ],
  },
  {
    id: "quantization",
    title: "4-bit NF4",
    role: "Memory reduction for training",
    detail:
      "Base weights are loaded in 4-bit NF4 with BF16 compute, which is what makes fine-tuning a model of this size tractable on a single accelerator.",
    inputArtifact: "Base weights",
    outputArtifact: "4-bit quantized base",
    facts: pick("Quantization", "Compute dtype", "Gradient checkpointing"),
  },
  {
    id: "qlora",
    title: "QLoRA Fine-Tuning",
    role: "Low-rank adapter training",
    detail:
      "Low-rank adapters are trained on top of the frozen quantized base, so only a small fraction of parameters receive gradients.",
    inputArtifact: "4-bit quantized base + Dolly 15K",
    outputArtifact: "Trained LoRA adapter",
    facts: pick(
      "LoRA rank",
      "LoRA alpha",
      "Trainable parameters",
      "Epochs",
      "Batch size",
      "Learning rate",
      "LoRA dropout",
      "Target modules",
      "Max sequence length",
    ),
  },
  {
    id: "artifact",
    title: "Model Artifact",
    role: "Packaged deployable",
    detail:
      "The adapter and its configuration are packaged into the artifact consumed by the inference container.",
    inputArtifact: "Trained LoRA adapter",
    outputArtifact: "model.tar.gz",
    facts: [{ label: "Adapter method", value: MODEL.adapterMethod }],
  },
  {
    id: "deployment",
    title: "SageMaker Deployment",
    role: "Hosted inference",
    detail:
      "The artifact is deployed to a SageMaker endpoint, which is what the runtime request path invokes.",
    inputArtifact: "model.tar.gz",
    outputArtifact: "InService endpoint",
    facts: [{ label: "Endpoint status", value: "InService" }],
  },
];
