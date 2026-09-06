import { buildRequestBody, normalizeResponse } from "./adapter";
import { loadConfig, type InferenceConfig } from "./config";
import { renderPrompt } from "./prompt";
import {
  DEFAULT_PARAMS,
  InferenceError,
  type InferenceErrorCode,
  type InferenceRequest,
  type InferenceResult,
} from "./types";

export interface ClientDeps {
  fetchImpl?: typeof fetch;
  now?: () => number;
  config?: InferenceConfig;
}

function statusToCode(status: number): InferenceErrorCode {
  if (status === 401 || status === 403) return "upstream_auth";
  if (status === 429) return "upstream_throttle";
  if (status >= 500) return "upstream_5xx";
  return "upstream_4xx";
}

function statusToMessage(status: number, code: InferenceErrorCode): string {
  switch (code) {
    case "upstream_auth":
      return `API Gateway rejected the request credentials (HTTP ${status}).`;
    case "upstream_throttle":
      return `API Gateway throttled the request (HTTP ${status}).`;
    case "upstream_5xx":
      return `The Lambda or SageMaker endpoint returned an error (HTTP ${status}).`;
    default:
      return `The request was rejected (HTTP ${status}).`;
  }
}

export async function runInference(
  request: InferenceRequest,
  deps: ClientDeps = {},
): Promise<InferenceResult> {
  const config = deps.config ?? loadConfig();
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());

  const promptSent = renderPrompt(request.instruction, request.context);
  const body = buildRequestBody(promptSent, request.params, config);

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) {
    headers[config.apiKeyHeader] = config.apiKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = now();

  let response: Response;
  try {
    response = await fetchImpl(config.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    // Message states only the observed fact. No server-side cause is asserted.
    if ((error as Error)?.name === "AbortError") {
      throw new InferenceError(
        "timeout",
        `The request exceeded the configured timeout of ${config.timeoutMs} ms and was aborted.`,
      );
    }
    throw new InferenceError("network", "The request could not reach the endpoint.", {
      detail: (error as Error)?.message,
    });
  } finally {
    clearTimeout(timer);
  }

  // Measured total round-trip. Not decomposable into per-hop durations.
  const durationMs = now() - startedAt;

  if (!response.ok) {
    const code = statusToCode(response.status);
    // Read upstream text for the server log only; it never reaches the client.
    const detail = await response.text().catch(() => "");
    throw new InferenceError(code, statusToMessage(response.status, code), {
      httpStatus: response.status,
      detail: detail.slice(0, 500),
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new InferenceError(
      "malformed_response",
      "The endpoint returned a success status but the body was not valid JSON.",
      { httpStatus: response.status },
    );
  }

  return {
    text: normalizeResponse(payload),
    durationMs,
    httpStatus: response.status,
    parametersSent: config.supportsParameters,
    promptSent,
  };
}

/**
 * Explicit, user-initiated reachability check. This performs a real
 * invocation, so it is never called automatically on page load.
 */
export async function probeEndpoint(deps: ClientDeps = {}): Promise<boolean> {
  try {
    const result = await runInference(
      { instruction: "Reply with the single word: ok", params: DEFAULT_PARAMS },
      deps,
    );
    return result.text.length > 0;
  } catch {
    return false;
  }
}
