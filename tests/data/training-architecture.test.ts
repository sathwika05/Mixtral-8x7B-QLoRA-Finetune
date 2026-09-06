import { describe, expect, it } from "vitest";
import { TRAINING_NODES } from "@/data/training-architecture";

describe("training flow", () => {
  it("follows the model-development order", () => {
    expect(TRAINING_NODES.map((n) => n.id)).toEqual([
      "dataset",
      "tokenization",
      "base-model",
      "quantization",
      "frozen-base",
      "lora-adapters",
      "forward",
      "loss",
      "backprop",
      "update",
      "artifact",
      "deployment",
    ]);
  });

  it("keeps exactly one frozen weight store and marks updates as adapter-only", () => {
    const frozen = TRAINING_NODES.filter((n) => n.kind === "frozen");
    expect(frozen.map((n) => n.id)).toEqual(["frozen-base"]);
    expect(TRAINING_NODES.find((n) => n.id === "update")?.label).toMatch(/adapters only/i);
  });

  it("states no latency or throughput figure, since none was measured", () => {
    const prose = TRAINING_NODES.map((n) => `${n.label} ${n.sublabel}`).join(" ");
    expect(prose).not.toMatch(/\bms\b|\bs\/step\b|tokens per second|throughput/i);
  });
});
