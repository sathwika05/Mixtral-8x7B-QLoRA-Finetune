// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RuntimeFlowRail } from "@/components/flow/runtime-flow-rail";
import { LifecycleTrack } from "@/components/flow/lifecycle-track";
import { RUNTIME_NODES } from "@/data/runtime-flow";
import { LIFECYCLE_STAGES } from "@/data/lifecycle";

describe("RuntimeFlowRail", () => {
  it("renders every runtime node in order", () => {
    render(<RuntimeFlowRail active={false} durationMs={null} />);
    for (const node of RUNTIME_NODES) {
      expect(screen.getByText(node.label)).toBeInTheDocument();
    }
  });

  it("shows no latency figure before a run completes", () => {
    render(<RuntimeFlowRail active={false} durationMs={null} />);
    expect(screen.queryByTestId("round-trip")).not.toBeInTheDocument();
  });

  it("renders the measured total and labels it as round-trip", () => {
    render(<RuntimeFlowRail active={false} durationMs={812} />);
    expect(screen.getByTestId("round-trip")).toHaveTextContent("812");
    expect(screen.getByText("ms total round-trip")).toBeInTheDocument();
  });

  it("renders exactly one figure, and scopes it to total round-trip", () => {
    const { container } = render(<RuntimeFlowRail active={false} durationMs={812} />);
    // The only number on the rail is the measured total; no hop carries one.
    expect(screen.getByTestId("round-trip")).toHaveTextContent("812");
    expect(screen.queryAllByTestId("hop-timing")).toHaveLength(0);
    expect(screen.getByText("ms total round-trip")).toBeInTheDocument();
    // And nothing attributes latency to a server-side cause.
    expect((container.textContent ?? "").toLowerCase()).not.toContain("cold");
  });

  it("treats every node identically while in flight, asserting no current hop", () => {
    render(<RuntimeFlowRail active durationMs={null} />);
    const nodes = screen.getAllByTestId("runtime-node");
    expect(nodes).toHaveLength(RUNTIME_NODES.length);
    const states = new Set(nodes.map((n) => n.getAttribute("data-state")));
    expect(states).toEqual(new Set(["in-flight"]));
  });

  it("does not claim a request was never issued after one failed", () => {
    render(<RuntimeFlowRail active={false} durationMs={null} errored />);
    expect(screen.queryByText(/no request issued/i)).not.toBeInTheDocument();
    expect(screen.getByText(/request failed/i)).toBeInTheDocument();
    // Still no number: nothing was measured.
    expect(screen.queryByTestId("round-trip")).not.toBeInTheDocument();
  });

  it("marks the rail errored without blaming a specific hop", () => {
    render(<RuntimeFlowRail active={false} durationMs={null} errored />);
    const nodes = screen.getAllByTestId("runtime-node");
    expect(new Set(nodes.map((n) => n.getAttribute("data-state")))).toEqual(
      new Set(["error"]),
    );
  });

  it("renders per-hop timings only when they are actually supplied", () => {
    const { rerender } = render(<RuntimeFlowRail active={false} durationMs={812} />);
    expect(screen.queryByTestId("hop-timing")).not.toBeInTheDocument();
    rerender(
      <RuntimeFlowRail active={false} durationMs={812} hopTimings={{ lambda: 40 }} />,
    );
    expect(screen.getAllByTestId("hop-timing")).toHaveLength(1);
  });
});

describe("LifecycleTrack", () => {
  it("renders the development stages and is not tied to request state", () => {
    render(<LifecycleTrack />);
    for (const stage of LIFECYCLE_STAGES) {
      expect(screen.getByText(stage.title)).toBeInTheDocument();
    }
    // It accepts no props at all, so no request state can drive it.
    expect(LifecycleTrack.length).toBe(0);
  });
});
