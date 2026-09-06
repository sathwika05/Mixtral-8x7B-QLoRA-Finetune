"use client";

import { Metric } from "@/components/system/metric";
import { exportJson, summarize } from "@/lib/run-log";
import type { TelemetryRecord } from "@/lib/inference/types";

function download(records: TelemetryRecord[]) {
  const blob = new Blob([exportJson(records)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "run-log.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RunLogTable({
  records,
  onClear,
}: {
  records: TelemetryRecord[];
  onClear: () => void;
}) {
  const summary = summarize(records);

  if (records.length === 0) {
    return (
      <p className="num text-[11px] text-muted-foreground">
        No runs observed in this session.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-4">
            <Metric label="Median" value={summary.medianMs} unit="ms" />
            <Metric label="Fastest" value={summary.minMs} unit="ms" />
            <Metric label="Slowest" value={summary.maxMs} unit="ms" />
          </div>
          <p className="num text-[10px] text-muted-foreground">
            Median of {summary.count} observed run{summary.count === 1 ? "" : "s"} this
            session · total round-trip only
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              {[
                "Time",
                "Outcome",
                "Round-trip",
                "HTTP",
                "Params",
                "Chars",
                "Instruction",
              ].map((heading) => (
                <th
                  key={heading}
                  className="num px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                data-testid={`run-row-${record.id}`}
                className="border-b border-border last:border-b-0"
              >
                <td className="num px-2 py-2 text-[11px] text-muted-foreground">
                  {record.at.slice(11, 19)}
                </td>
                <td className="num px-2 py-2 text-[11px]">
                  <span
                    className={
                      record.outcome === "success"
                        ? "text-signal-ok"
                        : "text-signal-error"
                    }
                  >
                    {record.outcome === "success" ? "success" : record.errorCode}
                  </span>
                </td>
                <td className="num px-2 py-2 text-[11px] text-foreground">
                  {record.outcome === "success" ? `${record.durationMs} ms` : "—"}
                </td>
                <td className="num px-2 py-2 text-[11px] text-muted-foreground">
                  {record.httpStatus ?? "—"}
                </td>
                <td className="num px-2 py-2 text-[11px] text-muted-foreground">
                  {record.parametersSent ? "sent" : "not sent"}
                </td>
                <td className="num px-2 py-2 text-[11px] text-muted-foreground">
                  {record.outputChars ?? "—"}
                </td>
                <td className="px-2 py-2 text-[11px] text-muted-foreground">
                  {record.instructionPreview}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => download(records)}
          className="num border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onClear}
          className="num border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Clear log
        </button>
      </div>
    </div>
  );
}
