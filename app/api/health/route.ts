import { NextResponse } from "next/server";
import { probeEndpoint } from "@/lib/inference/client";
import { isConfigured, loadConfig } from "@/lib/inference/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inspection only. This handler must never contact AWS: a reachability check
 * costs a real model invocation, so it cannot be a side effect of page load.
 * The strongest state obtainable here is `configured`.
 */
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      state: "not_configured" as const,
      supportsParameters: false,
      timeoutMs: null,
    });
  }

  const config = loadConfig();
  return NextResponse.json({
    state: "configured" as const,
    supportsParameters: config.supportsParameters,
    timeoutMs: config.timeoutMs,
  });
}

/** Explicit, user-initiated probe. Performs one real invocation. */
export async function POST() {
  if (!isConfigured()) {
    return NextResponse.json({ state: "not_configured" as const });
  }

  const reachable = await probeEndpoint();
  return NextResponse.json({
    state: reachable ? ("reachable" as const) : ("unavailable" as const),
  });
}
