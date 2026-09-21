import { NextResponse } from "next/server";

import { triage } from "@/lib/jev/client";
import { JevError } from "@/lib/jev/types";
import { resolve, type Resolution } from "@/lib/triage/resolve";

/**
 * Edge runtime: this route is one network hop in front of Jev and does no
 * Node-specific work, so running it at the edge removes cold-start and
 * region-hop latency from the critical path.
 */
export const runtime = "edge";
export const dynamic = "force-dynamic";

/** Long enough for a panicked sentence, short enough to bound token cost. */
const MAX_INPUT = 600;

export interface TriageResponse extends Resolution {
  latencyMs: number;
  mocked: boolean;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Field 'text' is required." }, { status: 400 });
  }

  const state = text.trim().slice(0, MAX_INPUT);

  try {
    const decision = await triage(state);
    const payload: TriageResponse = {
      ...resolve(decision.answers),
      latencyMs: decision.latencyMs,
      mocked: decision.mocked,
    };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    // Any failure here - timeout, bad key, unexpected schema - must still leave
    // the user with a usable screen. The fallback protocol is that screen, and
    // it leads with the emergency-call button. We never return a bare 500 to a
    // client that is mid-emergency.
    const message = err instanceof JevError ? err.message : "Triage failed.";
    console.error("[triage]", message, err instanceof JevError ? err.raw : err);

    const fallback: TriageResponse = {
      protocol: "fallback_emergency_call",
      rationale: "The routing service could not be reached.",
      degraded: true,
      answers: {
        condition: { value: "unknown", confidence: 0 },
        age_band: { value: "adult", confidence: 0 },
        responsive: { value: "unknown", confidence: 0 },
      },
      latencyMs: 0,
      mocked: false,
    };
    return NextResponse.json(fallback, {
      status: 200,
      headers: { "Cache-Control": "no-store", "X-Triage-Degraded": "1" },
    });
  }
}
