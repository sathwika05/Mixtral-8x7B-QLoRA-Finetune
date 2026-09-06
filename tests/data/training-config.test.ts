import { describe, expect, it } from "vitest";
import {
  CONFIG_GROUPS,
  REFERENCED_FACT_LABELS,
} from "@/data/training-config";
import { TRAINING_FACTS } from "@/data/model";

const allEntries = CONFIG_GROUPS.flatMap((g) => g.entries);
const byLabel = Object.fromEntries(allEntries.map((e) => [e.label, e.value]));

describe("training configuration panel", () => {
  it("surfaces every value the owner supplied, with the supplied value", () => {
    expect(byLabel["Base model"]).toBe("Mixtral-8x7B-v0.1");
    expect(byLabel["Dataset"]).toBe("Databricks Dolly 15K");
    expect(byLabel["Fine-tuning"]).toBe("QLoRA");
    expect(byLabel["Quantization"]).toBe("4-bit NF4");
    expect(byLabel["Compute dtype"]).toBe("BF16");
    expect(byLabel["LoRA rank"]).toBe(64);
    expect(byLabel["LoRA alpha"]).toBe(16);
    expect(byLabel["Epochs"]).toBe(2);
    expect(byLabel["Batch size"]).toBe(2);
    expect(byLabel["Learning rate"]).toBe("2e-4");
    expect(byLabel["Gradient checkpointing"]).toBe("Enabled");
    expect(byLabel["Trainable parameters"]).toBe("~3.96%");
  });

  it("marks none of the supplied values as unrecorded", () => {
    for (const entry of allEntries) {
      expect(entry.value, entry.label).not.toBeNull();
    }
  });

  it("references only labels that exist, so a rename cannot blank a card", () => {
    const known = new Set(TRAINING_FACTS.map((f) => f.label));
    for (const label of REFERENCED_FACT_LABELS) {
      expect(known.has(label), label).toBe(true);
    }
  });


  it("gives every group a purpose without turning into a lesson", () => {
    for (const group of CONFIG_GROUPS) {
      expect(group.purpose.length, group.id).toBeGreaterThan(0);
      // Concise by construction: a purpose line, not a paragraph of theory.
      expect(group.purpose.length, group.id).toBeLessThan(300);
    }
  });

  it("claims no result the owner did not provide", () => {
    const prose = CONFIG_GROUPS.map((g) => `${g.title} ${g.purpose}`)
      .join(" ")
      .toLowerCase();
    for (const banned of [
      "training loss",
      "validation loss",
      "accuracy",
      "gpu utilization",
      "gpu util",
      "throughput",
      "tokens per second",
      "perplexity",
      "converged",
    ]) {
      expect(prose, banned).not.toContain(banned);
    }
  });
});
