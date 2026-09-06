// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInference } from "@/hooks/use-inference";
import { resetRunLogStore } from "@/lib/run-log-store";
import { DEFAULT_PARAMS } from "@/lib/inference/types";

const input = { instruction: "Explain QLoRA.", params: DEFAULT_PARAMS };

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
  // The run log is a module-level store shared across routes, so it must be
  // reset between tests or one test's runs leak into the next.
  resetRunLogStore();
  vi.restoreAllMocks();
});

describe("useInference", () => {
  it("starts idle with an empty log", () => {
    const { result } = renderHook(() => useInference());
    expect(result.current.status).toBe("idle");
    expect(result.current.records).toEqual([]);
    expect(result.current.result).toBeNull();
  });

  it("posts to /api/inference and records a successful run", async () => {
    const fetchMock = mockFetch({
      ok: true,
      result: {
        text: "QLoRA freezes the base model.",
        durationMs: 812,
        httpStatus: 200,
        parametersSent: false,
        promptSent: "### Instruction:\nExplain QLoRA.",
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useInference());
    await act(async () => {
      await result.current.run(input);
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/inference");
    expect(result.current.result?.durationMs).toBe(812);

    const [record] = result.current.records;
    expect(record.outcome).toBe("success");
    expect(record.durationMs).toBe(812);
    expect(record.parametersSent).toBe(false);
    expect(record.outputChars).toBe("QLoRA freezes the base model.".length);
    expect(record.outputWords).toBe(5);
    expect(record.firstOfSession).toBe(true);
  });

  it("marks only the first successful run of the session", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        ok: true,
        result: {
          text: "ok",
          durationMs: 100,
          httpStatus: 200,
          parametersSent: false,
          promptSent: "p",
        },
      }),
    );
    const { result } = renderHook(() => useInference());
    await act(async () => {
      await result.current.run(input);
    });
    await act(async () => {
      await result.current.run(input);
    });
    await waitFor(() => expect(result.current.records).toHaveLength(2));
    expect(result.current.records[0].firstOfSession).toBe(false);
    expect(result.current.records[1].firstOfSession).toBe(true);
  });

  it("surfaces a sanitized error and logs the failed run", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        {
          ok: false,
          error: {
            code: "upstream_5xx",
            message: "The Lambda or SageMaker endpoint returned an error (HTTP 502).",
          },
        },
        false,
        502,
      ),
    );
    const { result } = renderHook(() => useInference());
    await act(async () => {
      await result.current.run(input);
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("upstream_5xx");
    expect(result.current.records[0].outcome).toBe("error");
    expect(result.current.records[0].errorCode).toBe("upstream_5xx");
    expect(result.current.records[0].outputChars).toBeNull();
  });

  it("reports a transport failure as a network error rather than crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed to fetch")));
    const { result } = renderHook(() => useInference());
    await act(async () => {
      await result.current.run(input);
    });
    await waitFor(() => expect(result.current.error?.code).toBe("network"));
  });

  it("clears the log on request", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        ok: true,
        result: {
          text: "ok",
          durationMs: 10,
          httpStatus: 200,
          parametersSent: false,
          promptSent: "p",
        },
      }),
    );
    const { result } = renderHook(() => useInference());
    await act(async () => {
      await result.current.run(input);
    });
    await waitFor(() => expect(result.current.records).toHaveLength(1));
    act(() => {
      result.current.clearLog();
    });
    expect(result.current.records).toEqual([]);
  });

  it("records harness runs pushed directly, assigning session-first correctly", async () => {
    const { result } = renderHook(() => useInference());
    act(() => {
      result.current.pushRecord({
        outcome: "success",
        durationMs: 500,
        httpStatus: 200,
        errorCode: null,
        parametersSent: false,
        params: DEFAULT_PARAMS,
        instructionPreview: "harness",
        outputChars: 10,
        outputWords: 2,
      });
    });
    await waitFor(() => expect(result.current.records).toHaveLength(1));
    expect(result.current.records[0].firstOfSession).toBe(true);
    expect(result.current.records[0].id).toBeTruthy();
    expect(result.current.records[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("run log sharing", () => {
  it("shows one hook's runs to another, since routes share a single log", async () => {
    const a = renderHook(() => useInference());
    const b = renderHook(() => useInference());

    act(() => {
      a.result.current.pushRecord({
        outcome: "success",
        durationMs: 300,
        httpStatus: 200,
        errorCode: null,
        parametersSent: false,
        params: DEFAULT_PARAMS,
        instructionPreview: "shared",
        outputChars: 4,
        outputWords: 1,
      });
    });

    await waitFor(() => expect(b.result.current.records).toHaveLength(1));
    expect(b.result.current.records[0].instructionPreview).toBe("shared");

    act(() => {
      b.result.current.clearLog();
    });
    await waitFor(() => expect(a.result.current.records).toHaveLength(0));
  });
});
