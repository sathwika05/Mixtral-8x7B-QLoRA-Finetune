import { describe, expect, it, vi } from "vitest";
import { InferenceError } from "@/lib/inference/types";

vi.mock("@/lib/inference/client", () => ({
  runInference: vi.fn(),
}));

import { runInference } from "@/lib/inference/client";
import { POST } from "@/app/api/inference/route";

const mockRun = vi.mocked(runInference);

function post(body: unknown): Request {
  return new Request("http://localhost/api/inference", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  instruction: "Explain QLoRA.",
  params: {
    max_new_tokens: 1024,
    temperature: 0.1,
    top_p: 0.6,
    repetition_penalty: 1.03,
  },
};

describe("POST /api/inference", () => {
  it("returns the result envelope on success", async () => {
    mockRun.mockResolvedValue({
      text: "QLoRA is...",
      durationMs: 812,
      httpStatus: 200,
      parametersSent: false,
      promptSent: "### Instruction:\nExplain QLoRA.",
    });

    const response = await POST(post(validBody));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        text: "QLoRA is...",
        durationMs: 812,
        httpStatus: 200,
        parametersSent: false,
        promptSent: "### Instruction:\nExplain QLoRA.",
      },
    });
  });

  it("rejects an invalid payload with 400 and does not call the client", async () => {
    mockRun.mockClear();
    const response = await POST(post({ instruction: "", params: validBody.params }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("upstream_4xx");
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON with 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/inference", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("maps each error code to the documented http status", async () => {
    const cases: Array<[string, number]> = [
      ["config_missing", 503],
      ["timeout", 504],
      ["upstream_auth", 502],
      ["upstream_throttle", 429],
      ["upstream_4xx", 502],
      ["upstream_5xx", 502],
      ["malformed_response", 502],
      ["network", 502],
    ];
    for (const [code, status] of cases) {
      mockRun.mockRejectedValueOnce(
        new InferenceError(code as never, `failure for ${code}`, {
          detail: "https://api.example.com key=super-secret-key",
        }),
      );
      const response = await POST(post(validBody));
      expect(response.status, code).toBe(status);
      const json = await response.json();
      expect(json).toEqual({ ok: false, error: { code, message: `failure for ${code}` } });
    }
  });

  it("never leaks detail, url, or key material in an error response", async () => {
    mockRun.mockRejectedValueOnce(
      new InferenceError("upstream_auth", "API Gateway rejected the request credentials.", {
        httpStatus: 403,
        detail: "https://api.example.com/prod key=super-secret-key",
      }),
    );
    const raw = await (await POST(post(validBody))).text();
    expect(raw).not.toContain("super-secret-key");
    expect(raw).not.toContain("api.example.com");
    expect(raw).not.toContain("detail");
  });

  it("converts an unexpected non-InferenceError into a generic 500 without detail", async () => {
    mockRun.mockRejectedValueOnce(new Error("boom at /Users/someone/secret/path.ts"));
    const response = await POST(post(validBody));
    expect(response.status).toBe(500);
    const raw = await response.text();
    expect(raw).not.toContain("/Users/someone");
  });
});
