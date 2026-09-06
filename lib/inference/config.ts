import { InferenceError } from "./types";

export interface InferenceConfig {
  apiUrl: string;
  apiKey?: string;
  apiKeyHeader: string;
  timeoutMs: number;
  promptField: string;
  paramsField: string;
  supportsParameters: boolean;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/** Only the variables this module reads; not the whole process environment. */
export type EnvSource = Record<string, string | undefined>;

function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/inference/config is server-only and must never be imported into client code.",
    );
  }
}

function text(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Presence check only. Never returns or logs the configured value. */
export function isConfigured(env: EnvSource = process.env): boolean {
  return Boolean(env.MIXTRAL_API_URL?.trim());
}

export function loadConfig(env: EnvSource = process.env): InferenceConfig {
  assertServer();

  const apiUrl = env.MIXTRAL_API_URL?.trim();
  if (!apiUrl) {
    throw new InferenceError(
      "config_missing",
      "MIXTRAL_API_URL is not set. Copy .env.example to .env.local and set the API Gateway invoke URL.",
    );
  }

  const apiKey = env.MIXTRAL_API_KEY?.trim();

  return {
    apiUrl,
    apiKey: apiKey ? apiKey : undefined,
    apiKeyHeader: text(env.MIXTRAL_API_KEY_HEADER, "x-api-key"),
    timeoutMs: positiveInt(env.MIXTRAL_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    promptField: text(env.MIXTRAL_PROMPT_FIELD, "prompt"),
    paramsField: text(env.MIXTRAL_PARAMS_FIELD, "parameters"),
    // Strict equality: anything other than the exact string "true" keeps
    // parameters off, so an ambiguous value never silently enables them.
    supportsParameters: env.MIXTRAL_SUPPORTS_PARAMETERS === "true",
  };
}
