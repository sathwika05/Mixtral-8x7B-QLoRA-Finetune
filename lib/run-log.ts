import type { TelemetryRecord } from "./inference/types";

export const RUN_LOG_KEY = "mixtral-console.run-log.v1";
export const MAX_RECORDS = 100;

export interface RunSummary {
  count: number;
  medianMs: number;
  minMs: number;
  maxMs: number;
}

export function loadRunLog(storage?: Storage | null): TelemetryRecord[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(RUN_LOG_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TelemetryRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRunLog(
  storage: Storage | null | undefined,
  records: TelemetryRecord[],
): void {
  if (!storage) return;
  try {
    storage.setItem(RUN_LOG_KEY, JSON.stringify(records));
  } catch {
    // A full or unavailable store must never break an inference run.
  }
}

export function appendRecord(
  records: TelemetryRecord[],
  record: TelemetryRecord,
): TelemetryRecord[] {
  return [record, ...records].slice(0, MAX_RECORDS);
}

/**
 * Statistics over genuinely observed successful runs only.
 * Returns null when there is nothing measured, so the UI never shows a
 * statistic with no observations behind it.
 */
export function summarize(records: TelemetryRecord[]): RunSummary | null {
  const durations = records
    .filter((r) => r.outcome === "success")
    .map((r) => r.durationMs)
    .sort((a, b) => a - b);

  if (durations.length === 0) return null;

  const mid = Math.floor(durations.length / 2);
  const medianMs =
    durations.length % 2 === 0
      ? Math.round((durations[mid - 1] + durations[mid]) / 2)
      : durations[mid];

  return {
    count: durations.length,
    medianMs,
    minMs: durations[0],
    maxMs: durations[durations.length - 1],
  };
}

export function exportJson(records: TelemetryRecord[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      observedRuns: records.length,
      note:
        "durationMs is total round-trip measured by the application. Per-hop durations are not instrumented.",
      records,
    },
    null,
    2,
  );
}
