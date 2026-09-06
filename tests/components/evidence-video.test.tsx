// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceVideo } from "@/components/evidence/evidence-video";
import { EVIDENCE_ITEMS } from "@/data/evidence";

const clip = EVIDENCE_ITEMS.find((i) => i.id === "training-logs")!;

describe("EvidenceVideo", () => {
  it("never presents the clip as something happening now", () => {
    render(<EvidenceVideo item={clip} available />);
    const body = (document.body.textContent ?? "").toLowerCase();
    for (const claim of [
      "streaming now",
      "happening now",
      "currently running",
      "in progress",
      "live stream",
    ]) {
      expect(body, claim).not.toContain(claim);
    }
  });

  it("does not autoplay and does not preload the file", () => {
    render(<EvidenceVideo item={clip} available />);
    const video = screen.getByTestId("evidence-video-player");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("poster");
  });

  it("states where a missing recording is expected instead of showing a player", () => {
    render(<EvidenceVideo item={clip} available={false} />);
    expect(screen.getByText(/recording not provided/i)).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-video-player")).not.toBeInTheDocument();
  });

  it("carries an accessible description of what the recording shows", () => {
    expect(clip.alt).toMatch(/1528/);
    expect(clip.alt).toMatch(/success/i);
    expect(clip.alt.length).toBeGreaterThan(40);
  });

  it("reports the step count as the observed fact, with no invented rate claim", () => {
    expect(clip.statedFact).toBe("1528/1528 steps · SUCCESS");
    // The caption may cite the per-step time the log itself printed, but must
    // not derive throughput, cost, or utilization from it.
    const prose = `${clip.caption} ${clip.statedFact}`.toLowerCase();
    for (const banned of ["tokens per second", "throughput", "gpu util", "cost"]) {
      expect(prose, banned).not.toContain(banned);
    }
  });

  it("claims no AWS metric in the caption", () => {
    const prose = `${clip.caption} ${clip.statedFact}`.toLowerCase();
    for (const banned of ["gpu utilization", "throughput", "cost", "tokens per second"]) {
      expect(prose, banned).not.toContain(banned);
    }
  });
});
