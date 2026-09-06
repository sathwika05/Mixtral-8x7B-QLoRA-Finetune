// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Metric } from "@/components/system/metric";
import { KvRow } from "@/components/system/kv-row";
import { HEALTH_LABEL, StatusBadge } from "@/components/system/status-badge";

describe("Metric", () => {
  it("renders a measured value in the tabular mono class", () => {
    render(<Metric label="Round-trip" value={812} unit="ms" />);
    const value = screen.getByText("812");
    expect(value).toHaveClass("num");
    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("renders Not recorded for null and drops the unit", () => {
    render(<Metric label="LoRA dropout" value={null} unit="ratio" />);
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
    expect(screen.queryByText("ratio")).not.toBeInTheDocument();
  });

  it("renders zero as a real value, not as missing", () => {
    render(<Metric label="Warmup steps" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Not recorded")).not.toBeInTheDocument();
  });
});

describe("KvRow", () => {
  it("renders label and value, falling back to Not recorded", () => {
    render(<KvRow label="Optimizer" value={null} />);
    expect(screen.getByText("Optimizer")).toBeInTheDocument();
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("labels every health state without ever saying LIVE", () => {
    const states = [
      "not_configured",
      "configured",
      "checking",
      "reachable",
      "unavailable",
    ] as const;
    for (const state of states) {
      const { unmount } = render(<StatusBadge state={state} />);
      expect(screen.getByText(HEALTH_LABEL[state])).toBeInTheDocument();
      expect(screen.queryByText(/\bLIVE\b/)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("distinguishes configured from reachable in its wording", () => {
    expect(HEALTH_LABEL.configured).toBe("Configured · not yet contacted");
    expect(HEALTH_LABEL.reachable).toBe("Reachable");
    expect(HEALTH_LABEL.unavailable).toBe("Unavailable");
  });
});
