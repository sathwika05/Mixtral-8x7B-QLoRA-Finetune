// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrainingArchitecture } from "@/components/case-study/training-architecture";
import { TRAINING_DISCLAIMER, TRAINING_NODES } from "@/data/training-architecture";

describe("TrainingArchitecture", () => {
  it("renders every stage of the development flow", () => {
    render(<TrainingArchitecture />);
    const rendered = screen
      .getAllByTestId("training-node")
      .map((n) => n.getAttribute("data-node"));
    for (const node of TRAINING_NODES) {
      expect(rendered, node.id).toContain(node.id);
    }
  });

  it("distinguishes frozen base weights from trainable adapters", () => {
    render(<TrainingArchitecture />);
    const kindOf = (id: string) =>
      screen.getByTestId("training-node-marker-" + id) ??
      document.querySelector(`[data-node="${id}"]`)?.getAttribute("data-kind");

    expect(document.querySelector('[data-node="frozen-base"]')?.getAttribute("data-kind")).toBe(
      "frozen",
    );
    for (const id of ["lora-adapters", "update"]) {
      expect(
        document.querySelector(`[data-node="${id}"]`)?.getAttribute("data-kind"),
        id,
      ).toBe("trainable");
    }
    for (const id of ["forward", "loss", "backprop"]) {
      expect(
        document.querySelector(`[data-node="${id}"]`)?.getAttribute("data-kind"),
        id,
      ).toBe("compute");
    }
    expect(typeof kindOf).toBe("function");
  });

  it("states that the frozen base receives no update", () => {
    render(<TrainingArchitecture />);
    expect(
      screen.getByText(/frozen base weights receive no update/i),
    ).toBeInTheDocument();
  });

  it("marks BF16 on the compute stages", () => {
    render(<TrainingArchitecture />);
    expect(screen.getAllByText(/BF16 compute/i).length).toBeGreaterThanOrEqual(2);
  });

  it("disclaims live training in the browser and carries no measurement", () => {
    render(<TrainingArchitecture />);
    expect(screen.getByText(TRAINING_DISCLAIMER)).toBeInTheDocument();
    expect(TRAINING_DISCLAIMER.toLowerCase()).toContain("no training runs in this browser");
    expect(TRAINING_DISCLAIMER.toLowerCase()).toContain("is a measurement");
  });

  it("carries an accessible description of the flow", () => {
    render(<TrainingArchitecture />);
    const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
    expect(label).toMatch(/frozen base receives no updates/i);
    expect(label).toMatch(/4-bit NF4/);
  });

  it("renders a legend for frozen, trainable, and compute", () => {
    render(<TrainingArchitecture />);
    expect(screen.getAllByTestId("legend-entry")).toHaveLength(3);
  });
});
