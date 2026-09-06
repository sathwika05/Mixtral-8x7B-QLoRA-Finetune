"use client";

import { useState } from "react";
import type { InferenceErrorCode } from "@/lib/inference/types";

export function OutputPane({
  status,
  text,
  error,
  promptSent,
}: {
  status: "idle" | "running" | "success" | "error";
  text: string | null;
  error: { code: InferenceErrorCode; message: string } | null;
  promptSent: string | null;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  if (status === "error" && error) {
    return (
      <div
        data-testid="error-state"
        className="border border-signal-error/40 bg-card p-4"
      >
        <div className="num text-[11px] uppercase tracking-wider text-signal-error">
          {error.code}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{error.message}</p>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="border border-border bg-card p-4">
        <span className="num text-[11px] uppercase tracking-wider text-signal-active">
          Awaiting response
        </span>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="border border-border bg-card p-4">
        <span className="num text-[11px] uppercase tracking-wider text-foreground/80">
          No output yet
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="num text-[11px] uppercase tracking-wider text-foreground/80">
          Model output
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPrompt((value) => !value)}
            className="num text-[11px] text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
          >
            {showPrompt ? "Hide prompt sent" : "Show prompt sent"}
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(text)}
            className="num text-[11px] text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
          >
            Copy
          </button>
        </div>
      </div>

      {showPrompt && promptSent ? (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap border border-border bg-muted p-3 text-[11px] leading-relaxed text-foreground/80">
          {promptSent}
        </pre>
      ) : null}

      <div
        data-testid="model-output"
        className="whitespace-pre-wrap border border-border bg-card p-4 text-sm leading-relaxed text-foreground"
      >
        {text}
      </div>
    </div>
  );
}
