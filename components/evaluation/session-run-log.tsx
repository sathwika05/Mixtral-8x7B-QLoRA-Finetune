"use client";

import { RunLogTable } from "@/components/evaluation/run-log-table";
import { useInference } from "@/hooks/use-inference";

/**
 * The session run log, standalone. Reads the shared store, so it shows the
 * same observations as the console regardless of which route recorded them.
 */
export function SessionRunLog() {
  const { records, clearLog } = useInference();
  return <RunLogTable records={records} onClear={clearLog} />;
}
