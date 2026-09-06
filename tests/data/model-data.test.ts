import { describe, expect, it } from "vitest";
import { MODEL, TRAINING_FACTS, formatFact } from "@/data/model";
import { LIFECYCLE_STAGES } from "@/data/lifecycle";
import { RUNTIME_NODES } from "@/data/runtime-flow";

describe("model facts", () => {
  it("uses the base-variant label and never claims the instruction-tuned variant", () => {
    expect(MODEL.label).toBe("Mixtral-8x7B-v0.1 · QLoRA Fine-Tuned");
    expect(MODEL.baseModel).toBe("Mixtral-8x7B-v0.1");
    expect(JSON.stringify(MODEL)).not.toMatch(/instruct/i);
  });

  it("records the owner-supplied training configuration", () => {
    const byLabel = Object.fromEntries(TRAINING_FACTS.map((f) => [f.label, f.value]));
    expect(byLabel["Epochs"]).toBe(2);
    expect(byLabel["Batch size"]).toBe(2);
    expect(byLabel["Learning rate"]).toBe("2e-4");
    expect(byLabel["Quantization"]).toBe("4-bit NF4");
    expect(byLabel["Compute dtype"]).toBe("BF16");
    expect(byLabel["Gradient checkpointing"]).toBe("Enabled");
    expect(byLabel["LoRA rank"]).toBe(64);
    expect(byLabel["LoRA alpha"]).toBe(16);
    expect(byLabel["Trainable parameters"]).toBe("~3.96%");
  });

  it("keeps genuinely unknown hyperparameters null rather than guessing", () => {
    const byLabel = Object.fromEntries(TRAINING_FACTS.map((f) => [f.label, f.value]));
    for (const label of [
      "LoRA dropout",
      "Target modules",
      "Max sequence length",
      "Gradient accumulation steps",
      "Optimizer",
      "LR scheduler",
      "Warmup steps",
    ]) {
      expect(byLabel[label], label).toBeNull();
    }
  });

  it("contains no accuracy, benchmark, or comparison claim", () => {
    const serialized = JSON.stringify({
      MODEL,
      TRAINING_FACTS,
      LIFECYCLE_STAGES,
    }).toLowerCase();
    for (const banned of [
      "accuracy",
      "bleu",
      "rouge",
      "perplexity",
      "benchmark",
      "outperform",
      "baseline score",
      "cost saving",
    ]) {
      expect(serialized, banned).not.toContain(banned);
    }
  });
});

describe("formatFact", () => {
  it("renders null as Not recorded and never as a default value", () => {
    expect(formatFact(null)).toBe("Not recorded");
    expect(formatFact(0)).toBe("0");
    expect(formatFact("")).toBe("Not recorded");
    expect(formatFact(64)).toBe("64");
    expect(formatFact("4-bit NF4")).toBe("4-bit NF4");
  });
});

describe("the two flows are modeled separately", () => {
  it("describes the development lifecycle in order", () => {
    expect(LIFECYCLE_STAGES.map((s) => s.id)).toEqual([
      "dataset",
      "base-model",
      "quantization",
      "qlora",
      "artifact",
      "deployment",
    ]);
  });

  it("describes the runtime request path in order", () => {
    expect(RUNTIME_NODES.map((n) => n.id)).toEqual([
      "app",
      "api-gateway",
      "lambda",
      "endpoint",
      "model",
      "response",
    ]);
  });

  it("shares no ids between the two, so neither can be rendered as the other", () => {
    const lifecycle = new Set(LIFECYCLE_STAGES.map((s) => s.id));
    for (const node of RUNTIME_NODES) {
      expect(lifecycle.has(node.id), node.id).toBe(false);
    }
  });
});
