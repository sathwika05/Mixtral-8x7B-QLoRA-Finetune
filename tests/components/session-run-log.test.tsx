// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SessionRunLog } from "@/components/evaluation/session-run-log";
import { resetRunLogStore } from "@/lib/run-log-store";

beforeEach(() => {
  window.sessionStorage.clear();
  resetRunLogStore();
});

describe("SessionRunLog", () => {
  it("states that nothing has been observed rather than showing an empty table", () => {
    render(<SessionRunLog />);
    expect(screen.getByText(/no runs observed in this session/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows no aggregate when there is nothing to aggregate", () => {
    render(<SessionRunLog />);
    expect(screen.queryByText(/median/i)).not.toBeInTheDocument();
  });
});
