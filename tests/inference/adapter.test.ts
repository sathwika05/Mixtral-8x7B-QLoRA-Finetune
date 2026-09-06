import { describe, expect, it } from "vitest";
import {
  buildRequestBody,
  describeShape,
  normalizeResponse,
} from "@/lib/inference/adapter";
import type { InferenceConfig } from "@/lib/inference/config";
import { DEFAULT_PARAMS, InferenceError } from "@/lib/inference/types";

const config: InferenceConfig = {
  apiUrl: "https://api.example.com/prod/invoke",
  apiKeyHeader: "x-api-key",
  timeoutMs: 60000,
  promptField: "prompt",
  paramsField: "parameters",
  supportsParameters: false,
};

describe("buildRequestBody", () => {
  it("sends the prompt alone when parameter support is off", () => {
    const body = buildRequestBody("hello", DEFAULT_PARAMS, config);
    expect(body).toEqual({ prompt: "hello" });
    expect(Object.keys(body)).toHaveLength(1);
    expect(body).not.toHaveProperty("parameters");
  });

  it("includes the parameter object when support is on", () => {
    const body = buildRequestBody("hello", DEFAULT_PARAMS, {
      ...config,
      supportsParameters: true,
    });
    expect(body).toEqual({
      prompt: "hello",
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.1,
        top_p: 0.6,
        repetition_penalty: 1.03,
      },
    });
  });

  it("honors env-overridden field names", () => {
    const body = buildRequestBody("hello", DEFAULT_PARAMS, {
      ...config,
      supportsParameters: true,
      promptField: "inputs",
      paramsField: "generation_config",
    });
    expect(Object.keys(body).sort()).toEqual(["generation_config", "inputs"]);
    expect(body.inputs).toBe("hello");
  });
});

describe("normalizeResponse", () => {
  it("accepts every documented output shape", () => {
    const cases: Array<[string, unknown]> = [
      ["bare string", "answer"],
      ["generated_text", { generated_text: "answer" }],
      ["response", { response: "answer" }],
      ["output", { output: "answer" }],
      ["completion", { completion: "answer" }],
      ["generation", { generation: "answer" }],
      ["array wrapper", [{ generated_text: "answer" }]],
      ["array of string", ["answer"]],
      ["api gateway body", { body: JSON.stringify({ generated_text: "answer" }) }],
      ["nested body string", { body: JSON.stringify({ response: "answer" }) }],
      ["statusCode envelope", { statusCode: 200, body: JSON.stringify(["answer"]) }],
    ];
    for (const [label, raw] of cases) {
      expect(normalizeResponse(raw), label).toBe("answer");
    }
  });

  it("preserves internal whitespace and only trims the edges", () => {
    expect(normalizeResponse({ generated_text: "  line one\n\nline two  " })).toBe(
      "line one\n\nline two",
    );
  });

  it("throws malformed_response with a keys-only summary for unknown shapes", () => {
    try {
      normalizeResponse({ weird: "s3://bucket/secret-path", other: 1 });
      throw new Error("should have thrown");
    } catch (error) {
      const err = error as InferenceError;
      expect(err).toBeInstanceOf(InferenceError);
      expect(err.code).toBe("malformed_response");
      expect(err.detail).toBe("object keys: other, weird");
      expect(err.detail).not.toContain("s3://");
      expect(err.message).not.toContain("s3://");
    }
  });

  it("throws malformed_response for an empty or non-string payload", () => {
    for (const raw of [
      null,
      undefined,
      42,
      {},
      [],
      { generated_text: 7 },
      { generated_text: "  " },
    ]) {
      expect(() => normalizeResponse(raw)).toThrowError(InferenceError);
    }
  });

  it("does not recurse indefinitely on a self-referential body wrapper", () => {
    const nested = {
      body: JSON.stringify({ body: JSON.stringify({ body: '"x"' }) }),
    };
    expect(() => normalizeResponse(nested)).toThrowError(InferenceError);
  });
});

describe("describeShape", () => {
  it("summarizes without leaking values", () => {
    expect(describeShape({ b: "secret", a: "secret" })).toBe("object keys: a, b");
    expect(describeShape(["x"])).toBe("array length 1");
    expect(describeShape("x")).toBe("string");
    expect(describeShape(null)).toBe("null");
    expect(describeShape(undefined)).toBe("undefined");
    expect(describeShape(7)).toBe("number");
  });
});
