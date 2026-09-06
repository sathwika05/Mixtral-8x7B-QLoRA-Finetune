import type { HealthState } from "@/lib/inference/types";
import { cn } from "@/lib/utils";

/**
 * Wording is deliberate: `configured` must never read as a verified
 * connection, and the word "LIVE" is not used for any state.
 */
export const HEALTH_LABEL: Record<HealthState, string> = {
  not_configured: "Not configured",
  configured: "Configured · not yet contacted",
  checking: "Checking",
  reachable: "Reachable",
  unavailable: "Unavailable",
};

const DOT: Record<HealthState, string> = {
  not_configured: "bg-signal-idle",
  configured: "bg-signal-idle",
  checking: "bg-signal-active animate-pulse",
  reachable: "bg-signal-ok",
  unavailable: "bg-signal-error",
};

const TEXT: Record<HealthState, string> = {
  not_configured: "text-muted-foreground",
  configured: "text-muted-foreground",
  checking: "text-signal-active",
  reachable: "text-signal-ok",
  unavailable: "text-signal-error",
};

export function StatusBadge({ state }: { state: HealthState }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-1.5 rounded-full", DOT[state])} aria-hidden />
      <span className={cn("num text-[11px] uppercase tracking-wider", TEXT[state])}>
        {HEALTH_LABEL[state]}
      </span>
    </span>
  );
}
