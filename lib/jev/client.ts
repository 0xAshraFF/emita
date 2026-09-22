import "server-only";

import {
  APIUserAbortError,
  TypeSafeClient,
  choice,
  type ChoiceResponse,
} from "@typesafe-ai/sdk";

import {
  AGE_BANDS,
  AGE_CRITERIA,
  CONDITIONS,
  CONDITION_CRITERIA,
  RESPONSIVENESS,
  RESPONSIVENESS_CRITERIA,
  QUESTION_INSTRUCTIONS,
} from "@/lib/triage/taxonomy";
import { mockTriage } from "./mock";
import { JevError, type ChoiceAnswer, type TriageDecision } from "./types";

/**
 * Hard ceiling on the Jev call. Jev is sub-second by design, so anything past
 * this is a network problem, not a slow decision. We would rather show the
 * fallback - which always leads with the emergency-call button - than leave a
 * panicking user staring at a spinner. This is well below the SDK's 10s default.
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

let cached: TypeSafeClient | null = null;

function client(): TypeSafeClient {
  if (cached) return cached;
  // apiKey, baseURL and defaultModel all fall back to TYPESAFE_* env vars.
  // Retries are disabled: a retry would blow the latency budget, and the
  // fallback screen is a better answer than a slow correct one.
  cached = new TypeSafeClient({
    timeout: TIMEOUT_MS,
    retry: { maxRetries: 0 },
  });
  return cached;
}

/**
 * The three questions, asked in a single pass over the same state.
 *
 * Question names are for our code only - they are not sent to the model - so
 * each `instructions` string has to carry its full meaning on its own. The
 * age and responsiveness questions are speculative with respect to the
 * condition, so each states its premise explicitly rather than relying on the
 * others: the model answers them in parallel and cannot see each other.
 */
const QUESTIONS = {
  condition: choice(QUESTION_INSTRUCTIONS.condition, CONDITION_CRITERIA),
  age_band: choice(QUESTION_INSTRUCTIONS.age_band, AGE_CRITERIA),
  responsive: choice(QUESTION_INSTRUCTIONS.responsive, RESPONSIVENESS_CRITERIA),
} as const;

/** Map an SDK ChoiceResponse onto the app's normalized answer shape. */
function normalize<T extends string>(
  answer: ChoiceResponse,
  allowed: readonly T[],
  fallback: T,
): ChoiceAnswer<T> {
  const match = allowed.find((a) => a === answer.choice);
  // An unrecognized label must degrade to the fallback protocol, never to a
  // guess, so we zero the confidence rather than trusting an unknown category.
  if (!match) return { value: fallback, confidence: 0 };
  return {
    value: match,
    confidence: answer.confidence,
    distribution: answer.probabilities as Partial<Record<T, number>>,
  };
}

export async function triage(
  state: string,
  signal?: AbortSignal,
): Promise<TriageDecision> {
  const started = Date.now();

  if (useMock()) {
    return { answers: mockTriage(state), latencyMs: Date.now() - started, mocked: true };
  }

  try {
    const { answers } = await client().systemOne({ state, questions: QUESTIONS }, { signal });

    return {
      answers: {
        condition: normalize(answers.condition, CONDITIONS, "unknown"),
        age_band: normalize(answers.age_band, AGE_BANDS, "adult"),
        responsive: normalize(answers.responsive, RESPONSIVENESS, "unknown"),
      },
      latencyMs: Date.now() - started,
      mocked: false,
    };
  } catch (err) {
    if (err instanceof APIUserAbortError) throw err;
    // Let the route turn any other failure into the fallback screen.
    throw new JevError(
      err instanceof Error ? err.message : "The Jev request failed.",
      (err as { status?: number })?.status,
      err,
    );
  }
}
