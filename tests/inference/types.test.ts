import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, InferenceError } from "@/lib/inference/types";

describe("InferenceError", () => {
  it("carries a code and is an Error", () => {
    const err = new InferenceError("timeout", "Request exceeded 60000 ms");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("InferenceError");
    expect(err.code).toBe("timeout");
    expect(err.message).toBe("Request exceeded 60000 ms");
  });

  it("optionally carries an http status and a redacted detail", () => {
    const err = new InferenceError("upstream_5xx", "Upstream failed", {
      httpStatus: 502,
      detail: "keys: message",
    });
    expect(err.httpStatus).toBe(502);
    expect(err.detail).toBe("keys: message");
  });

  it("serializes to a client-safe shape with no detail and no stack", () => {
    const err = new InferenceError("upstream_auth", "Rejected", {
      httpStatus: 403,
      detail: "https://secret.example.com?key=abc",
    });
    const wire = err.toClientJSON();
    expect(wire).toEqual({ code: "upstream_auth", message: "Rejected" });
    expect(JSON.stringify(wire)).not.toContain("secret.example.com");
  });
});

describe("DEFAULT_PARAMS", () => {
  it("exposes the four generation controls", () => {
    expect(DEFAULT_PARAMS).toEqual({
      max_new_tokens: 1024,
      temperature: 0.1,
      top_p: 0.6,
      repetition_penalty: 1.03,
    });
  });
});
