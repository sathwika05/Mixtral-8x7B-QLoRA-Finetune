"use client";

import type { InferenceParams } from "@/lib/inference/types";
import { cn } from "@/lib/utils";

const FIELDS: Array<{
  key: keyof InferenceParams;
  label: string;
  step: number;
  min: number;
  max: number;
}> = [
  { key: "max_new_tokens", label: "max_new_tokens", step: 1, min: 1, max: 4096 },
  { key: "temperature", label: "temperature", step: 0.05, min: 0, max: 2 },
  { key: "top_p", label: "top_p", step: 0.05, min: 0, max: 1 },
  { key: "repetition_penalty", label: "repetition_penalty", step: 0.05, min: 0.5, max: 2 },
];

export function ParameterPanel({
  params,
  onChange,
  enabled,
}: {
  params: InferenceParams;
  onChange: (next: InferenceParams) => void;
  enabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {!enabled ? (
        <div className="border border-border bg-muted px-3 py-2">
          <div className="num text-[11px] uppercase tracking-wider text-signal-active">
            Fixed by the deployed Lambda
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
            The handler sets these values and applies them to every request.
            <span className="mt-1 block">
              Also set server-side: do_sample true, top_k 50, return_full_text
              false, stop sequence &lt;/s&gt;.
            </span>
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span className="num text-[10px] uppercase tracking-wider text-foreground/80">
              {field.label}
            </span>
            <input
              type="number"
              value={params[field.key]}
              step={field.step}
              min={field.min}
              max={field.max}
              disabled={!enabled}
              onChange={(event) =>
                onChange({ ...params, [field.key]: Number(event.target.value) })
              }
              className={cn(
                "num w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground",
                "focus:border-border-strong focus:outline-none",
                !enabled && "cursor-not-allowed opacity-50",
              )}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
