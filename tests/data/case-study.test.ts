import { describe, expect, it } from "vitest";
import {
  CASE_STUDY_STAGES,
  TRAINING_DECISIONS,
} from "@/data/case-study";

describe("case study stages", () => {
  it("tells the nine stages in the approved order", () => {
    expect(CASE_STUDY_STAGES.map((s) => s.id)).toEqual([
      "problem",
      "approach",
      "qlora-architecture",
      "training-configuration",
      "aws-deployment",
      "runtime-architecture",
      "inference-request",
      "evaluation-observability",
      "engineering-decisions",
    ]);
  });

  it("gives every stage a title and a thesis", () => {
    for (const stage of CASE_STUDY_STAGES) {
      expect(stage.title.length, stage.id).toBeGreaterThan(0);
      expect(stage.thesis.length, stage.id).toBeGreaterThan(0);
    }
  });

  it("claims no unmeasured result anywhere in the narrative", () => {
    const prose = [
      ...CASE_STUDY_STAGES.flatMap((s) => [s.title, s.thesis, ...s.body]),
      ...TRAINING_DECISIONS.flatMap((d) => [d.decision, d.constraint, d.tradeoff]),
    ]
      .join(" ")
      .toLowerCase();

    for (const banned of [
      "accuracy",
      "bleu",
      "rouge",
      "perplexity",
      "outperform",
      "state of the art",
      "cost saving",
      "gpu util",
      "tokens per second",
      "speedup",
      "% faster",
      "% better",
    ]) {
      expect(prose, banned).not.toContain(banned);
    }
  });

  it("never claims the instruction-tuned variant", () => {
    const prose = CASE_STUDY_STAGES.flatMap((s) => [s.thesis, ...s.body]).join(" ");
    expect(prose).not.toMatch(/\bInstruct\b/);
  });

  it("does not attribute latency to a cold start", () => {
    const prose = [
      ...CASE_STUDY_STAGES.flatMap((s) => s.body),
      ...TRAINING_DECISIONS.map((d) => d.tradeoff),
    ]
      .join(" ")
      .toLowerCase();
    expect(prose).not.toContain("cold start");
  });
});

describe("decision cards", () => {
  it("states a decision, a constraint, and a trade-off for each", () => {
    expect(TRAINING_DECISIONS.length).toBeGreaterThan(0);
    for (const decision of TRAINING_DECISIONS) {
      expect(decision.decision.length, decision.id).toBeGreaterThan(0);
      expect(decision.constraint.length, decision.id).toBeGreaterThan(0);
      expect(decision.tradeoff.length, decision.id).toBeGreaterThan(0);
      expect(decision.recordedAs.length, decision.id).toBeGreaterThan(0);
    }
  });

  it("uses unique ids", () => {
    const ids = TRAINING_DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("training decisions", () => {
  it("covers each training choice the owner asked to justify", () => {
    expect(TRAINING_DECISIONS.map((d) => d.id)).toEqual([
      "why-qlora",
      "why-nf4",
      "why-lora",
      "why-bf16",
      "why-grad-checkpointing",
      "why-rank-64",
    ]);
  });

  it("cites the configuration value actually recorded for each", () => {
    const byId = Object.fromEntries(TRAINING_DECISIONS.map((d) => [d.id, d.recordedAs]));
    expect(byId["why-nf4"]).toBe("4-bit NF4");
    expect(byId["why-bf16"]).toBe("BF16");
    expect(byId["why-grad-checkpointing"]).toBe("Enabled");
    expect(byId["why-rank-64"]).toBe("rank 64 · alpha 16");
    for (const decision of TRAINING_DECISIONS) {
      expect(decision.recordedAs.length, decision.id).toBeGreaterThan(0);
    }
  });

  it("states a cost for every choice, never a bare benefit", () => {
    for (const decision of TRAINING_DECISIONS) {
      expect(decision.constraint.length, decision.id).toBeGreaterThan(0);
      expect(decision.tradeoff.length, decision.id).toBeGreaterThan(0);
    }
  });

  it("never presents a choice as universally optimal", () => {
    const prose = TRAINING_DECISIONS.map((d) => `${d.decision} ${d.tradeoff}`)
      .join(" ")
      .toLowerCase();
    for (const banned of [
      "best practice",
      "the best ",
      "optimal choice",
      "always ",
      "industry standard",
      "state of the art",
      "should always",
      "recommended approach",
    ]) {
      expect(prose, banned).not.toContain(banned);
    }
  });

  it("claims no measured training result", () => {
    const prose = TRAINING_DECISIONS.map((d) => `${d.constraint} ${d.tradeoff}`)
      .join(" ")
      .toLowerCase();
    for (const banned of [
      "training loss",
      "validation loss",
      "accuracy",
      "gpu utilization",
      "throughput",
      "converged",
      "faster than",
    ]) {
      expect(prose, banned).not.toContain(banned);
    }
  });
});
