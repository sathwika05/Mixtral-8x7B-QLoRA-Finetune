// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceVideo } from "@/components/evidence/evidence-video";
import { EVIDENCE_ITEMS } from "@/data/evidence";

const video = EVIDENCE_ITEMS.find((i) => i.id === "training-logs")!;

describe("landing page evidence", () => {
  it("carries a video evidence item with a poster so nothing preloads", () => {
    expect(video.kind).toBe("video");
    expect(video.poster).toBeTruthy();
    expect(video.statedFact).toBe("1528/1528 steps · SUCCESS");
  });

  it("makes no liveness claim anywhere in the block", () => {
    render(<EvidenceVideo item={video} available />);
    // Liveness is now carried by the player itself: a paused <video> with
    // controls cannot read as a stream. Nothing may assert otherwise.
    const text = (document.body.textContent ?? "").toLowerCase();
    expect(text).not.toMatch(
      /\bstreaming now\b|\blive now\b|\bcurrently training\b|\blive stream\b/,
    );
  });

  it("does not autoplay", () => {
    const { container } = render(<EvidenceVideo item={video} available />);
    const el = container.querySelector("video");
    expect(el).toBeTruthy();
    expect(el?.hasAttribute("autoplay")).toBe(false);
    expect(el?.getAttribute("preload")).toBe("metadata");
  });
});
