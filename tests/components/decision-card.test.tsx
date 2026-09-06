// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecisionCard } from "@/components/case-study/decision-card";
import { TRAINING_DECISIONS } from "@/data/case-study";

const qlora = TRAINING_DECISIONS.find((d) => d.id === "why-qlora")!;

describe("DecisionCard", () => {
  it("renders all four fields", () => {
    render(<DecisionCard decision={qlora} />);
    for (const label of ["Decision", "Constraint", "Trade-off", "Recorded as"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(qlora.decision)).toBeInTheDocument();
    expect(screen.getByText(qlora.tradeoff)).toBeInTheDocument();
  });

});

describe("DecisionCard for a training decision", () => {
  const nf4 = TRAINING_DECISIONS.find((d) => d.id === "why-nf4")!;

  it("cites the recorded configuration value instead of a file", () => {
    render(<DecisionCard decision={nf4} />);
    expect(screen.getByText("Recorded as")).toBeInTheDocument();
    expect(screen.getByTestId("recorded-as")).toHaveTextContent("4-bit NF4");
    expect(screen.queryByText("Enforced by")).not.toBeInTheDocument();
  });

  it("shows the cost alongside the decision", () => {
    render(<DecisionCard decision={nf4} />);
    expect(screen.getByText("Trade-off")).toBeInTheDocument();
    expect(screen.getByText(nf4.tradeoff)).toBeInTheDocument();
  });
});
