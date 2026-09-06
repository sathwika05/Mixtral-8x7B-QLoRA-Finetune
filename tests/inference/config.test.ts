import { describe, expect, it } from "vitest";
import { isConfigured, loadConfig } from "@/lib/inference/config";
import { InferenceError } from "@/lib/inference/types";

const base = { MIXTRAL_API_URL: "https://api.example.com/prod/invoke" };

describe("loadConfig", () => {
  it("applies documented defaults when only the URL is set", () => {
    const config = loadConfig(base);
    expect(config.apiUrl).toBe("https://api.example.com/prod/invoke");
    expect(config.apiKey).toBeUndefined();
    expect(config.apiKeyHeader).toBe("x-api-key");
    expect(config.timeoutMs).toBe(60000);
    expect(config.promptField).toBe("prompt");
    expect(config.paramsField).toBe("parameters");
    expect(config.supportsParameters).toBe(false);
  });

  it("throws config_missing when the URL is absent or blank", () => {
    expect(() => loadConfig({})).toThrowError(InferenceError);
    try {
      loadConfig({ MIXTRAL_API_URL: "   " });
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as InferenceError).code).toBe("config_missing");
    }
  });

  it("treats only the exact string 'true' as parameter support", () => {
    const on = loadConfig({
      ...base,
      MIXTRAL_SUPPORTS_PARAMETERS: "true",
    });
    expect(on.supportsParameters).toBe(true);
    for (const value of ["false", "TRUE", "1", "yes", ""]) {
      const off = loadConfig({
        ...base,
        MIXTRAL_SUPPORTS_PARAMETERS: value,
      });
      expect(off.supportsParameters, `value=${value}`).toBe(false);
    }
  });

  it("falls back to the default timeout when the value is not a positive number", () => {
    for (const value of ["abc", "0", "-5", ""]) {
      const config = loadConfig({
        ...base,
        MIXTRAL_TIMEOUT_MS: value,
      });
      expect(config.timeoutMs, `value=${value}`).toBe(60000);
    }
    expect(
      loadConfig({ ...base, MIXTRAL_TIMEOUT_MS: "15000" }).timeoutMs,
    ).toBe(15000);
  });

  it("refuses to run in a browser environment", () => {
    const globalRef = globalThis as { window?: unknown };
    globalRef.window = {};
    try {
      expect(() => loadConfig(base)).toThrowError(/server/i);
    } finally {
      delete globalRef.window;
    }
  });
});

describe("isConfigured", () => {
  it("reports presence without throwing and without revealing the value", () => {
    expect(isConfigured(base)).toBe(true);
    expect(isConfigured({})).toBe(false);
    expect(isConfigured({ MIXTRAL_API_URL: "  " })).toBe(false);
  });
});
