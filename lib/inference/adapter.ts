import type { InferenceConfig } from "./config";
import { InferenceError, type InferenceParams } from "./types";

/** Output keys accepted from the Lambda, in priority order. */
const TEXT_KEYS = [
  "generated_text",
  "response",
  "output",
  "completion",
  "generation",
] as const;

/** Guards against an endlessly nested `{ body: "..." }` envelope. */
const MAX_UNWRAP_DEPTH = 2;

export function buildRequestBody(
  prompt: string,
  params: InferenceParams,
  config: InferenceConfig,
): Record<string, unknown> {
  const body: Record<string, unknown> = { [config.promptField]: prompt };

  // Parameters are omitted entirely -- not sent as null, not sent empty --
  // until the deployed Lambda contract is confirmed to accept them.
  if (config.supportsParameters) {
    body[config.paramsField] = { ...params };
  }

  return body;
}

/** Structural summary for diagnostics. Never includes values. */
export function describeShape(raw: unknown): string {
  if (raw === null) return "null";
  if (raw === undefined) return "undefined";
  if (Array.isArray(raw)) return `array length ${raw.length}`;
  if (typeof raw === "object") {
    const keys = Object.keys(raw as Record<string, unknown>).sort();
    return `object keys: ${keys.join(", ")}`;
  }
  return typeof raw;
}

function extract(raw: unknown, depth: number): string | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
  }

  if (Array.isArray(raw)) {
    return raw.length > 0 ? extract(raw[0], depth) : null;
  }

  if (raw !== null && typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    for (const key of TEXT_KEYS) {
      const value = record[key];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
      }
    }

    // API Gateway proxy integrations wrap the payload in a JSON string.
    if (typeof record.body === "string" && depth < MAX_UNWRAP_DEPTH) {
      try {
        return extract(JSON.parse(record.body), depth + 1);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function normalizeResponse(raw: unknown): string {
  const text = extract(raw, 0);
  if (text === null) {
    throw new InferenceError(
      "malformed_response",
      "The endpoint responded, but the payload did not match any known output shape.",
      { detail: describeShape(raw) },
    );
  }
  return text;
}
