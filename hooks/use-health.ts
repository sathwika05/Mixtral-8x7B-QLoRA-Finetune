"use client";

import { useCallback, useEffect, useState } from "react";
import type { HealthState } from "@/lib/inference/types";

export function useHealth() {
  const [state, setState] = useState<HealthState>("checking");
  const [supportsParameters, setSupportsParameters] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState<number | null>(null);

  // Inspection only. This never triggers a model invocation, so the strongest
  // state reachable on load is `configured`.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setState(payload.state as HealthState);
        setSupportsParameters(Boolean(payload.supportsParameters));
        setTimeoutMs(payload.timeoutMs ?? null);
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Explicit user action. Performs one real invocation. */
  const probe = useCallback(async () => {
    setState("checking");
    try {
      const response = await fetch("/api/health", { method: "POST" });
      const payload = await response.json();
      setState(payload.state as HealthState);
    } catch {
      setState("unavailable");
    }
  }, []);

  return { state, supportsParameters, timeoutMs, probe };
}
