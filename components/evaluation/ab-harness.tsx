"use client";

import { useState } from "react";
import { OutputPane } from "@/components/console/output-pane";
import { useHealth } from "@/hooks/use-health";
import type { RecordInput } from "@/hooks/use-inference";
import { PRESETS } from "@/data/presets";
import {
  DEFAULT_PARAMS,
  type InferenceErrorCode,
  type InferenceParams,
  type InferenceResult,
} from "@/lib/inference/types";

interface Side {
  label: string;
  params: InferenceParams;
  result: InferenceResult | null;
  error: { code: InferenceErrorCode; message: string } | null;
}

const EMPTY: Side[] = [
  { label: "Run A", params: DEFAULT_PARAMS, result: null, error: null },
  {
    label: "Run B",
    params: { ...DEFAULT_PARAMS, temperature: 1.0 },
    result: null,
    error: null,
  },
];

function countWords(text: string): number {
  return text.trim().match(/\S+/g)?.length ?? 0;
}

export function AbHarness({
  onObserved,
}: {
  onObserved: (input: RecordInput) => void;
}) {
  const { supportsParameters } = useHealth();
  const [instruction, setInstruction] = useState(PRESETS[0].instruction);
  const [sides, setSides] = useState<Side[]>(EMPTY);
  const [running, setRunning] = useState(false);

  async function runBoth() {
    setRunning(true);
    const next = await Promise.all(
      sides.map(async (side): Promise<Side> => {
        // With parameters unsupported there is no axis to vary, so both sides
        // send an identical request and the comparison observes variability.
        const params = supportsParameters ? side.params : DEFAULT_PARAMS;
        try {
          const response = await fetch("/api/inference", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ instruction, params }),
          });
          const payload = await response.json();

          // Harness runs are real requests, so they belong in the session log.
          onObserved({
            outcome: payload.ok ? "success" : "error",
            durationMs: payload.ok ? payload.result.durationMs : 0,
            httpStatus: payload.ok ? payload.result.httpStatus : response.status,
            errorCode: payload.ok ? null : (payload.error.code as InferenceErrorCode),
            parametersSent: payload.ok ? payload.result.parametersSent : false,
            params,
            instructionPreview: instruction.slice(0, 120),
            outputChars: payload.ok ? payload.result.text.length : null,
            outputWords: payload.ok ? countWords(payload.result.text) : null,
          });

          return payload.ok
            ? { ...side, result: payload.result as InferenceResult, error: null }
            : { ...side, result: null, error: payload.error };
        } catch {
          onObserved({
            outcome: "error",
            durationMs: 0,
            httpStatus: null,
            errorCode: "network",
            parametersSent: false,
            params,
            instructionPreview: instruction.slice(0, 120),
            outputChars: null,
            outputWords: null,
          });
          return {
            ...side,
            result: null,
            error: {
              code: "network" as const,
              message: "The request could not complete.",
            },
          };
        }
      }),
    );
    setSides(next);
    setRunning(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {supportsParameters
          ? "Runs the same instruction under two parameter sets. This is an observation tool: no output is ranked, rated, or compared against the base model."
          : "Generation parameters are not yet supported by the deployed contract, so both sides send an identical request. This observes run-to-run variability. No output is ranked, rated, or compared against the base model."}
      </p>

      <textarea
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={3}
        className="w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-border-strong focus:outline-none"
      />

      <button
        type="button"
        onClick={runBoth}
        disabled={running || instruction.trim().length === 0}
        className="num w-fit border border-border-strong bg-primary px-4 py-2 text-[11px] uppercase tracking-wider text-primary-foreground disabled:opacity-40"
      >
        {running ? "Running both" : "Run both"}
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        {sides.map((side) => (
          <div key={side.label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="num text-[11px] uppercase tracking-wider text-muted-foreground">
                {side.label}
              </span>
              {side.result ? (
                <span className="num text-[11px] text-muted-foreground">
                  {side.result.durationMs} ms round-trip
                </span>
              ) : null}
            </div>
            <OutputPane
              status={
                side.error
                  ? "error"
                  : side.result
                    ? "success"
                    : running
                      ? "running"
                      : "idle"
              }
              text={side.result?.text ?? null}
              error={side.error}
              promptSent={side.result?.promptSent ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
