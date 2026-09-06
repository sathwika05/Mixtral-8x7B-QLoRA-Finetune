/** Generation controls. Sent only when MIXTRAL_SUPPORTS_PARAMETERS is true. */
export interface InferenceParams {
  max_new_tokens: number;
  temperature: number;
  top_p: number;
  repetition_penalty: number;
}

/**
 * The generation settings the deployed Lambda applies. They are fixed in the
 * handler rather than read from the request, so these are displayed as the
 * backend's configuration -- not as controls the browser can change.
 */
export const DEFAULT_PARAMS: InferenceParams = {
  max_new_tokens: 1024,
  temperature: 0.1,
  top_p: 0.6,
  repetition_penalty: 1.03,
};

export interface InferenceRequest {
  instruction: string;
  context?: string;
  params: InferenceParams;
}

export interface InferenceResult {
  /** Normalized model output. */
  text: string;
  /** Total round-trip measured server-side. Not a per-hop figure. */
  durationMs: number;
  httpStatus: number;
  /** False when the backend contract is not confirmed to accept parameters. */
  parametersSent: boolean;
  /** The exact prompt string transmitted, for reviewer inspection. */
  promptSent: string;
}

export type InferenceErrorCode =
  | "config_missing"
  | "timeout"
  | "upstream_auth"
  | "upstream_throttle"
  | "upstream_4xx"
  | "upstream_5xx"
  | "malformed_response"
  | "network";

interface InferenceErrorOptions {
  httpStatus?: number;
  /** Server-side diagnostic only. Never sent to the browser. */
  detail?: string;
}

export class InferenceError extends Error {
  readonly code: InferenceErrorCode;
  readonly httpStatus?: number;
  readonly detail?: string;

  constructor(
    code: InferenceErrorCode,
    message: string,
    options: InferenceErrorOptions = {},
  ) {
    super(message);
    this.name = "InferenceError";
    this.code = code;
    this.httpStatus = options.httpStatus;
    this.detail = options.detail;
  }

  /** The only representation permitted to cross the network to the browser. */
  toClientJSON(): { code: InferenceErrorCode; message: string } {
    return { code: this.code, message: this.message };
  }
}

/**
 * Health is never asserted without evidence.
 * `configured` means env is present and nothing has been contacted.
 * `reachable` / `unavailable` are earned only by an actual request.
 */
export type HealthState =
  | "not_configured"
  | "configured"
  | "checking"
  | "reachable"
  | "unavailable";

export interface TelemetryRecord {
  id: string;
  /** ISO-8601 timestamp. */
  at: string;
  outcome: "success" | "error";
  /** Total round-trip in ms, measured. */
  durationMs: number;
  httpStatus: number | null;
  errorCode: InferenceErrorCode | null;
  parametersSent: boolean;
  params: InferenceParams;
  instructionPreview: string;
  outputChars: number | null;
  outputWords: number | null;
  /** True only when no prior successful run exists in this session's log. */
  firstOfSession: boolean;
}
