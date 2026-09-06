import { appendRecord, loadRunLog, saveRunLog } from "./run-log";
import type { TelemetryRecord } from "./inference/types";

/** The hook assigns id, timestamp, and firstOfSession itself. */
export type RecordInput = Omit<TelemetryRecord, "id" | "at" | "firstOfSession">;

/**
 * A module-level store rather than per-hook React state.
 *
 * Two reasons: the run log is shared across routes -- a run started on the
 * console must appear in the evaluation log without a reload -- and reading
 * sessionStorage is a subscription to an external system, which is what
 * useSyncExternalStore is for. Per-component state would fork the log and
 * force a setState inside an effect on every mount.
 */

const EMPTY: TelemetryRecord[] = [];

let records: TelemetryRecord[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function sessionStore(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function hydrateOnce(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loaded = loadRunLog(sessionStore());
  if (loaded.length > 0) {
    records = loaded;
    emit();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  hydrateOnce();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): TelemetryRecord[] {
  return records;
}

/** The server has no session, so it always renders an empty log. */
export function getServerSnapshot(): TelemetryRecord[] {
  return EMPTY;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Appends an observed run. Every real request made by the application funnels
 * through here -- including the evaluation harness -- so the log genuinely
 * covers the whole session.
 */
export function addRecord(input: RecordInput): void {
  const record: TelemetryRecord = {
    ...input,
    id: newId(),
    at: new Date().toISOString(),
    // True only when no earlier successful run exists in this session.
    // A statement about the session log, never about server state.
    firstOfSession:
      input.outcome === "success" && !records.some((r) => r.outcome === "success"),
  };
  records = appendRecord(records, record);
  saveRunLog(sessionStore(), records);
  emit();
}

export function clearRecords(): void {
  records = EMPTY;
  saveRunLog(sessionStore(), records);
  emit();
}

/** Test-only: restores the module to its initial state. */
export function resetRunLogStore(): void {
  records = EMPTY;
  hydrated = false;
  listeners.clear();
}
