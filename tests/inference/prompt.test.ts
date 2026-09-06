import { describe, expect, it } from "vitest";
import { renderPrompt } from "@/lib/inference/prompt";

describe("renderPrompt", () => {
  it("renders the no-context Dolly form", () => {
    expect(renderPrompt("Explain mixture-of-experts routing.")).toBe(
      [
        "Below is an instruction that describes a task. " +
          "Write a response that appropriately completes the request.",
        "",
        "### Instruction:",
        "Explain mixture-of-experts routing.",
        "",
        "### Response:",
        "",
      ].join("\n"),
    );
  });

  it("renders the with-context Dolly form including an Input block", () => {
    const out = renderPrompt("Summarize the passage.", "Mixtral has 8 experts.");
    expect(out).toContain("### Instruction:\nSummarize the passage.");
    expect(out).toContain("### Input:\nMixtral has 8 experts.");
    expect(out.indexOf("### Input:")).toBeGreaterThan(out.indexOf("### Instruction:"));
    expect(out.indexOf("### Response:")).toBeGreaterThan(out.indexOf("### Input:"));
    expect(out).toContain(
      "Below is an instruction that describes a task, paired with an input " +
        "that provides further context. Write a response that appropriately " +
        "completes the request.",
    );
  });

  it("omits the Input block when context is blank or whitespace", () => {
    for (const context of [undefined, "", "   ", "\n\t"]) {
      expect(renderPrompt("Do a thing.", context)).not.toContain("### Input:");
    }
  });

  it("trims surrounding whitespace but never truncates the body", () => {
    const long = "word ".repeat(4000).trim();
    const out = renderPrompt(`  ${long}  `);
    expect(out).toContain(long);
    expect(out).not.toContain("…");
  });

  it("rejects an empty instruction", () => {
    expect(() => renderPrompt("   ")).toThrowError(/instruction/i);
  });
});
