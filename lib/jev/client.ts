import "server-only";

import {
  AGE_BANDS,
  AGE_DESCRIPTIONS,
  CONDITIONS,
  CONDITION_DESCRIPTIONS,
  RESPONSIVENESS,
  RESPONSIVENESS_DESCRIPTIONS,
} from "@/lib/triage/taxonomy";
import { mockTriage } from "./mock";
import { JevError, type TriageDecision } from "./types";
import { authHeaders, buildChoice, buildRequestBody, parseChoice } from "./wire";

const DEFAULT_URL = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_MODEL = "jev-1";

/**
 * Hard ceiling on the Jev call. Jev is sub-second by design, so anything past
 * this is a network problem, not a slow decision. We would rather show the
 * fallback - which always includes the emergency-call button - than leave a
 * panicking user staring at a spinner.
 */
const TIMEOUT_MS = 1500;

function useMock(): boolean {
  if (process.env.JEV_MOCK !== "1") return false;
  if (process.env.NODE_ENV === "production") {
    throw new JevError(
      "JEV_MOCK=1 is set in a production build. The mock router is keyword matching, not a model, and must never serve real users.",
    );
  }
  return true;
}

/** The three questions, built once - they never vary between requests. */
function triageQuestions() {
  return {
    condition: buildChoice(
      "Which single emergency is being described? Choose 'unknown' unless the description clearly indicates one of the others.",
      CONDITIONS,
      CONDITION_DESCRIPTIONS,
    ),
    age_band: buildChoice(
      "How old is the person the emergency is happening to?",
      AGE_BANDS,
      AGE_DESCRIPTIONS,
    ),
    responsive: buildChoice(
      "Is the person awake and reacting?",
      RESPONSIVENESS,
      RESPONSIVENESS_DESCRIPTIONS,
    ),
  };
}

export async function triage(state: string): Promise<TriageDecision> {
  const started = Date.now();

  if (useMock()) {
    return { answers: mockTriage(state), latencyMs: Date.now() - started, mocked: true };
  }

  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) {
    throw new JevError("JEV_API_KEY is not set. Set it, or set JEV_MOCK=1 for local development.");
  }

  const url = process.env.JEV_API_URL || DEFAULT_URL;
  const model = process.env.JEV_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(buildRequestBody(state, model, triageQuestions())),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new JevError(`Jev did not respond within ${TIMEOUT_MS}ms.`);
    }
    throw new JevError(`Could not reach Jev: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new JevError(`Jev returned ${res.status}.`, res.status, body.slice(0, 500));
  }

  const json: unknown = await res.json().catch(() => {
    throw new JevError("Jev returned a body that is not valid JSON.");
  });

  const condition = parseChoice(json, "condition", CONDITIONS);
  const age = parseChoice(json, "age_band", AGE_BANDS);
  const responsive = parseChoice(json, "responsive", RESPONSIVENESS);

  if (!condition) {
    // The wire shape did not match any pattern in wire.ts. Surface the raw body
    // in development so the schema can be corrected in one place.
    throw new JevError(
      "Could not read a 'condition' answer from the Jev response. The response envelope likely differs from the assumption in lib/jev/wire.ts.",
      undefined,
      process.env.NODE_ENV === "development" ? json : undefined,
    );
  }

  return {
    answers: {
      condition,
      // A missing age or responsiveness is survivable: both have safe defaults
      // and low confidence routes them through the fallback logic in resolve.ts.
      age_band: age ?? { value: "adult", confidence: 0 },
      responsive: responsive ?? { value: "unknown", confidence: 0 },
    },
    latencyMs: Date.now() - started,
    mocked: false,
  };
}
