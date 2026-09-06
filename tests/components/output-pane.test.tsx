// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OutputPane } from "@/components/console/output-pane";

describe("OutputPane", () => {
  it("shows an empty state before any run", () => {
    render(<OutputPane status="idle" text={null} error={null} promptSent={null} />);
    expect(screen.getByText(/no output yet/i)).toBeInTheDocument();
  });

  it("renders model output as a document, not as chat bubbles", () => {
    render(
      <OutputPane
        status="success"
        text="QLoRA freezes the base."
        error={null}
        promptSent="p"
      />,
    );
    const output = screen.getByTestId("model-output");
    expect(output).toHaveTextContent("QLoRA freezes the base.");
    expect(output.className).not.toMatch(/rounded-(xl|2xl|full)/);
  });

  it("shows the exact prompt that was transmitted, behind an explicit toggle", async () => {
    const user = userEvent.setup();
    render(
      <OutputPane
        status="success"
        text="answer"
        error={null}
        promptSent="### Instruction:\nExplain QLoRA."
      />,
    );
    // Hidden by default so the output stays the focus.
    expect(screen.queryByText(/### Instruction:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show prompt sent/i }));
    expect(screen.getByText(/### Instruction:/)).toBeInTheDocument();
  });

  it("renders an error message without diagnosing a server-side cause", () => {
    render(
      <OutputPane
        status="error"
        text={null}
        error={{
          code: "timeout",
          message:
            "The request exceeded the configured timeout of 60000 ms and was aborted.",
        }}
        promptSent={null}
      />,
    );
    const body = screen.getByTestId("error-state").textContent ?? "";
    expect(body).toContain("60000");
    expect(body.toLowerCase()).not.toContain("cold start");
    expect(screen.getByText("timeout")).toBeInTheDocument();
  });
});
