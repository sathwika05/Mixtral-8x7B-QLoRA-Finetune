// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunLogTable } from "@/components/evaluation/run-log-table";
import { DEFAULT_PARAMS, type TelemetryRecord } from "@/lib/inference/types";

function record(overrides: Partial<TelemetryRecord> = {}): TelemetryRecord {
  return {
    id: "r1",
    at: "2026-08-21T10:00:00.000Z",
    outcome: "success",
    durationMs: 800,
    httpStatus: 200,
    errorCode: null,
    parametersSent: false,
    params: DEFAULT_PARAMS,
    instructionPreview: "Explain QLoRA.",
    outputChars: 100,
    outputWords: 18,
    firstOfSession: true,
    ...overrides,
  };
}

describe("RunLogTable", () => {
  it("states that nothing has been observed when the log is empty", () => {
    render(<RunLogTable records={[]} onClear={vi.fn()} />);
    expect(screen.getByText(/no runs observed in this session/i)).toBeInTheDocument();
    expect(screen.queryByText(/median/i)).not.toBeInTheDocument();
  });

  it("labels aggregates with the observed sample size", () => {
    render(
      <RunLogTable
        records={[
          record({ id: "a", durationMs: 400 }),
          record({ id: "b", durationMs: 800 }),
        ]}
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/median of 2 observed runs this\s+session/i),
    ).toBeInTheDocument();
  });

  it("shows a dash rather than a latency figure for a failed run", () => {
    render(
      <RunLogTable
        records={[
          record({
            outcome: "error",
            errorCode: "upstream_5xx",
            httpStatus: null,
            durationMs: 0,
          }),
        ]}
        onClear={vi.fn()}
      />,
    );
    const row = screen.getByTestId("run-row-r1");
    expect(row).toHaveTextContent("upstream_5xx");
    expect(row).not.toHaveTextContent("0 ms");
  });

  it("contains no quality score or base-model comparison", () => {
    const { container } = render(<RunLogTable records={[record()]} onClear={vi.fn()} />);
    const text = (container.textContent ?? "").toLowerCase();
    for (const banned of [
      "score",
      "quality",
      "base model",
      "baseline",
      "accuracy",
      "better",
    ]) {
      expect(text, banned).not.toContain(banned);
    }
  });
});
