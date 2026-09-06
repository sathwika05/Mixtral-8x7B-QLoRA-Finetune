// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { EVIDENCE_ITEMS } from "@/data/evidence";

const training = EVIDENCE_ITEMS.find((item) => item.id === "training-job")!;

describe("EvidenceCard", () => {
  it("renders the image and the owner-reported fact when the file is present", () => {
    render(<EvidenceCard item={training} available />);
    expect(screen.getByAltText(training.alt)).toBeInTheDocument();
    expect(screen.getByText("Completed · approximately 7 hours")).toBeInTheDocument();
  });

  it("renders an explicit missing state instead of a placeholder image", () => {
    render(<EvidenceCard item={training} available={false} />);
    expect(screen.getByText(/screenshot not provided/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("still states the recorded fact when the image is absent", () => {
    render(<EvidenceCard item={training} available={false} />);
    expect(screen.getByText("Completed · approximately 7 hours")).toBeInTheDocument();
  });

  it("exposes no account id, arn, role, or endpoint identifier", () => {
    const { container } = render(<EvidenceCard item={training} available />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/arn:aws/i);
    expect(text).not.toMatch(/\b\d{12}\b/);
    expect(text).not.toMatch(/iam|role\//i);
  });
});
