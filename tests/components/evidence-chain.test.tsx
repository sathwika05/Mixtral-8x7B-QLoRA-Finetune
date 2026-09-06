// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceChain } from "@/components/case-study/evidence-chain";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { EVIDENCE_ITEMS, SANITIZATION_CHECKLIST } from "@/data/evidence";

const none = { "training-job": false, endpoint: false };
const both = { "training-job": true, endpoint: true };
const training = EVIDENCE_ITEMS.find((i) => i.id === "training-job")!;

describe("EvidenceChain", () => {
  it("renders the delivery chain in order", () => {
    render(<EvidenceChain availability={none} />);
    expect(
      screen.getAllByTestId("chain-node").map((n) => n.getAttribute("data-node")),
    ).toEqual(["data", "training", "qlora", "artifact", "serving", "runtime"]);
  });

  it("marks exactly the two nodes a screenshot attests to", () => {
    render(<EvidenceChain availability={none} />);
    const attested = screen
      .getAllByTestId("chain-node")
      .filter((n) => n.getAttribute("data-attested") === "true")
      .map((n) => n.getAttribute("data-node"));
    expect(attested).toEqual(["training", "serving"]);
  });

  it("says evidence is pending until the file actually exists", () => {
    const { unmount } = render(<EvidenceChain availability={none} />);
    expect(screen.getAllByText(/evidence pending/i)).toHaveLength(2);
    unmount();

    render(<EvidenceChain availability={both} />);
    expect(screen.getAllByText(/console evidence below/i)).toHaveLength(2);
    expect(screen.queryByText(/evidence pending/i)).not.toBeInTheDocument();
  });
});

describe("EvidenceCard", () => {
  it("renders the image and the owner-reported reading together", () => {
    render(<EvidenceCard item={training} available />);
    expect(screen.getByAltText(training.alt)).toBeInTheDocument();
    expect(screen.getByText(training.statedFact)).toBeInTheDocument();
  });

  it("states where a missing file is expected rather than showing a placeholder", () => {
    render(<EvidenceCard item={training} available={false} />);
    expect(screen.getByText(/screenshot not provided/i)).toBeInTheDocument();
    expect(screen.getByText(/public\/evidence\/training-job\.png/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("still attributes the owner-reported reading when the image is absent", () => {
    render(<EvidenceCard item={training} available={false} />);
    expect(screen.getByText("Completed · approximately 7 hours")).toBeInTheDocument();
  });

  it("claims no AWS metric anywhere in the evidence copy", () => {
    const prose = EVIDENCE_ITEMS.map((i) => `${i.caption} ${i.statedFact}`)
      .join(" ")
      .toLowerCase();
    for (const banned of [
      "gpu utilization",
      "gpu util",
      "throughput",
      "cost saving",
      "instance hours",
      "tokens per second",
      "spot saving",
    ]) {
      expect(prose, banned).not.toContain(banned);
    }
  });
});

describe("sanitization checklist", () => {
  it("names every identifier class the owner listed", () => {
    const joined = SANITIZATION_CHECKLIST.join(" ").toLowerCase();
    for (const needle of ["account id", "arn", "iam", "role", "credential", "key"]) {
      expect(joined, needle).toContain(needle);
    }
  });
});
