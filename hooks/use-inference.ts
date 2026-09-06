"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  addRecord,
  clearRecords,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type RecordInput,
} from "@/lib/run-log-store";
import type {
  InferenceErrorCode,
  InferenceParams,
  InferenceResult,
  TelemetryRecord,
} from "@/lib/inference/types";

export type { RecordInput };

export type InferenceStatus = "idle" | "running" | "success" | "error";

export interface ClientError {
  code: InferenceErrorCode;
  message: string;
}

export interface RunInput {
  instruction: string;
  context?: string;
  params: InferenceParams;
}

function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function useInference() {
  const [status, setStatus] = useState<InferenceStatus>("idle");
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<ClientError | null>(null);
  // Shared across routes and hydrated from sessionStorage by the store, so
  // mounting this hook never triggers a setState inside an effect.
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const abortRef = useRef<AbortController | null>(null);

  const pushRecord = useCallback((input: RecordInput) => {
    addRecord(input);
  }, []);

  const run = useCallback(
    async (input: RunInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("running");
      setError(null);
      setResult(null);

      let outcome: TelemetryRecord["outcome"] = "error";
      let durationMs = 0;
      let httpStatus: number | null = null;
      let errorCode: InferenceErrorCode | null = null;
      let parametersSent = false;
      let outputChars: number | null = null;
      let outputWords: number | null = null;

      try {
        const response = await fetch("/api/inference", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        const payload = await response.json();

        if (payload?.ok) {
          const inferenceResult = payload.result as InferenceResult;
          setResult(inferenceResult);
          setStatus("success");
          outcome = "success";
          durationMs = inferenceResult.durationMs;
          httpStatus = inferenceResult.httpStatus;
          parametersSent = inferenceResult.parametersSent;
          outputChars = inferenceResult.text.length;
          outputWords = countWords(inferenceResult.text);
        } else {
          const clientError: ClientError = payload?.error ?? {
            code: "network",
            message: "The server returned an unreadable response.",
          };
          setError(clientError);
          setStatus("error");
          errorCode = clientError.code;
          httpStatus = response.status;
        }
      } catch (caught) {
        if ((caught as Error)?.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setError({
          code: "network",
          message: "The request to this application's server could not complete.",
        });
        setStatus("error");
        errorCode = "network";
      }

      pushRecord({
        outcome,
        durationMs,
        httpStatus,
        errorCode,
        parametersSent,
        params: input.params,
        instructionPreview: input.instruction.slice(0, 120),
        outputChars,
        outputWords,
      });
    },
    [pushRecord],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const clearLog = useCallback(() => {
    clearRecords();
  }, []);

  return { status, result, error, records, run, pushRecord, cancel, clearLog };
}
