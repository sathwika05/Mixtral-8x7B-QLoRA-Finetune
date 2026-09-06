// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrainingConfig } from "@/components/case-study/training-config";
import { CONFIG_GROUPS } from "@/data/training-config";

describe("TrainingConfig", () => {
  it("renders one card per group rather than a single large table", () => {
    render(<TrainingConfig />);
    expect(screen.getAllByTestId("config-group")).toHaveLength(CONFIG_GROUPS.length);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the supplied values", () => {
    render(<TrainingConfig />);
    for (const value of ["Mixtral-8x7B-v0.1", "4-bit NF4", "BF16", "64", "16", "2e-4", "~3.96%"]) {
      expect(screen.getAllByText(value).length, value).toBeGreaterThan(0);
    }
  });

  it("states an engineering purpose for each group", () => {
    render(<TrainingConfig />);
    for (const group of CONFIG_GROUPS) {
      expect(screen.getByText(group.purpose)).toBeInTheDocument();
    }
  });


});
