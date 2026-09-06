"use client";

import { useState } from "react";
import { Panel, PanelBody } from "@/components/system/panel";
import { RuntimeFlowRail } from "@/components/flow/runtime-flow-rail";
import { OutputPane } from "@/components/console/output-pane";
import { ParameterPanel } from "@/components/console/parameter-panel";
import { useHealth } from "@/hooks/use-health";
import { useInference } from "@/hooks/use-inference";
import { DEFAULT_PARAMS } from "@/lib/inference/types";

export function Workbench() {
  const { supportsParameters } = useHealth();
  const { status, result, error, run, cancel } = useInference();
  const [instruction, setInstruction] = useState("");

  const running = status === "running";

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Runtime request path">
        <PanelBody>
          <RuntimeFlowRail
            active={running}
            durationMs={status === "success" ? (result?.durationMs ?? null) : null}
            errored={status === "error"}
          />
        </PanelBody>
      </Panel>

      <Panel title="Enter your prompt">
        <PanelBody className="flex flex-col gap-4">
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={4}
            aria-label="Enter your prompt"
            className="w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={running || instruction.trim().length === 0}
              onClick={() => run({ instruction, params: DEFAULT_PARAMS })}
              className="num border border-border-strong bg-primary px-4 py-2 text-[11px] uppercase tracking-wider text-primary-foreground disabled:opacity-40"
            >
              {running ? "Generating" : "Generate response"}
            </button>
            {running ? (
              <button
                type="button"
                onClick={cancel}
                className="num border border-border px-3 py-2 text-[11px] uppercase tracking-wider text-foreground/80 hover:text-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </PanelBody>
      </Panel>

      <Panel title="Model response">
        <PanelBody>
          <OutputPane
            status={status}
            text={result?.text ?? null}
            error={error}
            promptSent={result?.promptSent ?? null}
          />
        </PanelBody>
      </Panel>

      <Panel title="Generation parameters">
        <PanelBody>
          <ParameterPanel
            params={DEFAULT_PARAMS}
            onChange={() => {}}
            enabled={supportsParameters}
          />
        </PanelBody>
      </Panel>
    </div>
  );
}
