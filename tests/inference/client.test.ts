import { describe, expect, it, vi } from "vitest";
import { probeEndpoint, runInference } from "@/lib/inference/client";
import type { InferenceConfig } from "@/lib/inference/config";
import {
  DEFAULT_PARAMS,
  InferenceError,
  type InferenceErrorCode,
} from "@/lib/inference/types";

const config: InferenceConfig = {
  apiUrl: "https://api.example.com/prod/invoke",
  apiKey: "super-secret-key",
  apiKeyHeader: "x-api-key",
  timeoutMs: 60000,
  promptField: "prompt",
  paramsField: "parameters",
  supportsParameters: false,
};

const request = { instruction: "Explain QLoRA.", params: DEFAULT_PARAMS };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("runInference", () => {
  it("posts the rendered prompt and returns normalized text with a measured duration", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ generated_text: "QLoRA is..." }));
    let clock = 1000;
    const now = () => (clock += 250);

    const result = await runInference(request, { fetchImpl, config, now });

    expect(result.text).toBe("QLoRA is...");
    expect(result.durationMs).toBe(250);
    expect(result.httpStatus).toBe(200);
    expect(result.parametersSent).toBe(false);
    expect(result.promptSent).toContain("### Instruction:\nExplain QLoRA.");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(config.apiUrl);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ prompt: result.promptSent });
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.headers["x-api-key"]).toBe("super-secret-key");
  });

  it("omits the key header entirely when no key is configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ generated_text: "ok" }));
    await runInference(request, { fetchImpl, config: { ...config, apiKey: undefined } });
    const [, init] = fetchImpl.mock.calls[0];
    expect(Object.keys(init.headers)).not.toContain("x-api-key");
  });

  it("reports parametersSent true when the backend contract supports them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ generated_text: "ok" }));
    const result = await runInference(request, {
      fetchImpl,
      config: { ...config, supportsParameters: true },
    });
    expect(result.parametersSent).toBe(true);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).parameters).toEqual(
      DEFAULT_PARAMS,
    );
  });

  it("maps every upstream status to the documented error code", async () => {
    const cases: Array<[number, InferenceErrorCode]> = [
      [401, "upstream_auth"],
      [403, "upstream_auth"],
      [429, "upstream_throttle"],
      [400, "upstream_4xx"],
      [404, "upstream_4xx"],
      [500, "upstream_5xx"],
      [502, "upstream_5xx"],
      [504, "upstream_5xx"],
    ];
    for (const [status, code] of cases) {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(new Response("upstream detail", { status }));
      await expect(runInference(request, { fetchImpl, config })).rejects.toMatchObject({
        code,
        httpStatus: status,
      });
    }
  });

  it("never puts the url, the key, or the upstream body into the client-safe error", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response("Forbidden: key super-secret-key invalid", { status: 403 }),
      );
    try {
      await runInference(request, { fetchImpl, config });
      throw new Error("should have thrown");
    } catch (error) {
      const wire = JSON.stringify((error as InferenceError).toClientJSON());
      expect(wire).not.toContain("super-secret-key");
      expect(wire).not.toContain("api.example.com");
      expect(wire).not.toContain("Forbidden: key");
    }
  });

  it("classifies an abort as timeout and states the configured limit", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    try {
      await runInference(request, { fetchImpl, config: { ...config, timeoutMs: 15000 } });
      throw new Error("should have thrown");
    } catch (error) {
      const err = error as InferenceError;
      expect(err.code).toBe("timeout");
      expect(err.message).toContain("15000");
      // No cold-start attribution is permitted.
      expect(err.message.toLowerCase()).not.toContain("cold");
    }
  });

  it("classifies a transport failure as network", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(runInference(request, { fetchImpl, config })).rejects.toMatchObject({
      code: "network",
    });
  });

  it("classifies a non-JSON success body as malformed_response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));
    await expect(runInference(request, { fetchImpl, config })).rejects.toMatchObject({
      code: "malformed_response",
    });
  });
});

describe("probeEndpoint", () => {
  it("returns true only when a real request produces usable output", async () => {
    const ok = vi.fn().mockResolvedValue(jsonResponse({ generated_text: "hi" }));
    await expect(probeEndpoint({ fetchImpl: ok, config })).resolves.toBe(true);
  });

  it("returns false instead of throwing when the endpoint fails", async () => {
    const bad = vi.fn().mockResolvedValue(new Response("nope", { status: 502 }));
    await expect(probeEndpoint({ fetchImpl: bad, config })).resolves.toBe(false);
  });
});
