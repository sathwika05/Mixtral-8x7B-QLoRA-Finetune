import { NextResponse } from "next/server";
import { z } from "zod";
import { runInference } from "@/lib/inference/client";
import { InferenceError, type InferenceErrorCode } from "@/lib/inference/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  max_new_tokens: z.number().int().min(1).max(4096),
  temperature: z.number().min(0).max(2),
  top_p: z.number().min(0).max(1),
  repetition_penalty: z.number().min(0.5).max(2),
});

const bodySchema = z.object({
  instruction: z.string().trim().min(1).max(20000),
  context: z.string().max(20000).optional(),
  params: paramsSchema,
});

export function errorStatus(code: InferenceErrorCode): number {
  switch (code) {
    case "config_missing":
      return 503;
    case "timeout":
      return 504;
    case "upstream_throttle":
      return 429;
    default:
      // Every upstream failure is reported as a bad gateway: the fault is
      // between this server and AWS, not with the browser's request.
      return 502;
  }
}

function fail(code: InferenceErrorCode, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("upstream_4xx", "Request body must be valid JSON.", 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      "upstream_4xx",
      "Request body is invalid. An instruction and complete generation parameters are required.",
      400,
    );
  }

  try {
    const result = await runInference(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof InferenceError) {
      // Full detail stays on the server; only the sanitized shape goes out.
      console.error("[inference]", error.code, error.detail ?? error.message);
      return NextResponse.json(
        { ok: false, error: error.toClientJSON() },
        { status: errorStatus(error.code) },
      );
    }

    console.error("[inference] unexpected", error);
    return fail("network", "An unexpected server error occurred.", 500);
  }
}
