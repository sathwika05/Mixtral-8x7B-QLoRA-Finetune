import { describe, expect, it } from "vitest";
import {
  MAX_RECORDS,
  RUN_LOG_KEY,
  appendRecord,
  exportJson,
  loadRunLog,
  saveRunLog,
  summarize,
} from "@/lib/run-log";
import { DEFAULT_PARAMS, type TelemetryRecord } from "@/lib/inference/types";

function record(durationMs: number, overrides: Partial<TelemetryRecord> = {}): TelemetryRecord {
  return {
    id: `r-${durationMs}`,
    at: "2026-08-21T10:00:00.000Z",
    outcome: "success",
    durationMs,
    httpStatus: 200,
    errorCode: null,
    parametersSent: false,
    params: DEFAULT_PARAMS,
    instructionPreview: "Explain QLoRA.",
    outputChars: 120,
    outputWords: 20,
    firstOfSession: false,
    ...overrides,
  };
}

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

describe("summarize", () => {
  it("returns null for an empty log rather than zeroed statistics", () => {
    expect(summarize([])).toBeNull();
  });

  it("computes median, min, and max over successful runs only", () => {
    const records = [
      record(100),
      record(900),
      record(500),
      record(9999, { outcome: "error", errorCode: "timeout", httpStatus: null }),
    ];
    expect(summarize(records)).toEqual({ count: 3, medianMs: 500, minMs: 100, maxMs: 900 });
  });

  it("averages the two middle values for an even count", () => {
    expect(summarize([record(100), record(200), record(300), record(500)])?.medianMs).toBe(
      250,
    );
  });

  it("returns null when every run failed, since there is nothing measured to report", () => {
    expect(summarize([record(1, { outcome: "error" })])).toBeNull();
  });
});

describe("appendRecord", () => {
  it("prepends the newest record", () => {
    const result = appendRecord([record(100)], record(200));
    expect(result.map((r) => r.durationMs)).toEqual([200, 100]);
  });

  it("caps the log length", () => {
    let log: TelemetryRecord[] = [];
    for (let i = 0; i < MAX_RECORDS + 25; i += 1) {
      log = appendRecord(log, record(i));
    }
    expect(log).toHaveLength(MAX_RECORDS);
    expect(log[0].durationMs).toBe(MAX_RECORDS + 24);
  });
});

describe("persistence", () => {
  it("round-trips through storage", () => {
    const storage = new MemoryStorage();
    saveRunLog(storage, [record(300)]);
    expect(storage.getItem(RUN_LOG_KEY)).toContain("300");
    expect(loadRunLog(storage)).toHaveLength(1);
  });

  it("tolerates a missing, unavailable, or corrupt store", () => {
    expect(loadRunLog(null)).toEqual([]);
    expect(loadRunLog(undefined)).toEqual([]);
    const storage = new MemoryStorage();
    storage.setItem(RUN_LOG_KEY, "{not json");
    expect(loadRunLog(storage)).toEqual([]);
    expect(() => saveRunLog(null, [record(1)])).not.toThrow();
  });
});

describe("exportJson", () => {
  it("emits pretty-printed records with the observed count", () => {
    const json = JSON.parse(exportJson([record(300)]));
    expect(json.observedRuns).toBe(1);
    expect(json.records).toHaveLength(1);
    expect(json.note).toMatch(/round-trip/i);
  });
});
