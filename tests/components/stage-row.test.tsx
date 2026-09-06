// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StageRow } from "@/components/pipeline/stage-row";
import { LIFECYCLE_STAGES } from "@/data/lifecycle";

const qlora = LIFECYCLE_STAGES.find((stage) => stage.id === "qlora")!;

describe("StageRow", () => {
  it("renders the stage title and role collapsed", () => {
    render(<StageRow stage={qlora} index={3} />);
    expect(screen.getByText(qlora.title)).toBeInTheDocument();
    expect(screen.getByText(qlora.role)).toBeInTheDocument();
    expect(screen.queryByText(qlora.detail)).not.toBeInTheDocument();
  });

  it("reveals detail, artifacts, and facts on expand", async () => {
    const user = userEvent.setup();
    render(<StageRow stage={qlora} index={3} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText(qlora.detail)).toBeInTheDocument();
    expect(screen.getByText(qlora.inputArtifact)).toBeInTheDocument();
    expect(screen.getByText(qlora.outputArtifact)).toBeInTheDocument();
    expect(screen.getByText("LoRA rank")).toBeInTheDocument();
    expect(screen.getByText("64")).toBeInTheDocument();
  });

  it("renders unrecorded facts as Not recorded rather than omitting them", async () => {
    const user = userEvent.setup();
    render(<StageRow stage={qlora} index={3} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Target modules")).toBeInTheDocument();
    expect(screen.getAllByText("Not recorded").length).toBeGreaterThan(0);
  });
});
