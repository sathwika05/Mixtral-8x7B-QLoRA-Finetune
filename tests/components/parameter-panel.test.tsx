// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ParameterPanel } from "@/components/console/parameter-panel";
import { DEFAULT_PARAMS } from "@/lib/inference/types";

describe("ParameterPanel", () => {
  it("disables every control and explains why when the backend does not support parameters", () => {
    render(<ParameterPanel params={DEFAULT_PARAMS} onChange={vi.fn()} enabled={false} />);
    expect(screen.getByText(/fixed by the deployed lambda/i)).toBeInTheDocument();
    expect(
      screen.getByText(/applies them to every request/i),
    ).toBeInTheDocument();
    for (const input of screen.getAllByRole("spinbutton")) {
      expect(input).toBeDisabled();
    }
  });

  it("still displays the values so a reviewer can see what would be sent", () => {
    render(<ParameterPanel params={DEFAULT_PARAMS} onChange={vi.fn()} enabled={false} />);
    expect(screen.getByDisplayValue("1024")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0.1")).toBeInTheDocument();
  });

  it("enables the controls when the backend contract supports them", () => {
    render(<ParameterPanel params={DEFAULT_PARAMS} onChange={vi.fn()} enabled />);
    expect(screen.queryByText(/fixed by the deployed lambda/i)).not.toBeInTheDocument();
    for (const input of screen.getAllByRole("spinbutton")) {
      expect(input).toBeEnabled();
    }
  });
});
