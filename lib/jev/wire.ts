/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ============================================================================
 * THE ONLY FILE THAT KNOWS THE JEV WIRE FORMAT.
 * ============================================================================
 *
 * Everything else in the app speaks the normalized types in ./types.ts. When
 * the real schema is confirmed, correct it here and nothing else changes.
 *
 * VERIFIED from TypeSafe's public material:
 *   - Endpoint is POST https://api.typesafe.ai/v1/systemone
 *   - The body carries a `state`, a `model`, and a map of typed questions
 *   - The primitives are Choice, Score and Noul
 *   - Choice and Score answers each carry a confidence from 0 to 1
 *   - Every question in one request is evaluated against the same state in a
 *     single pass, with no token-by-token generation
 *
 * NOT YET VERIFIED (docs.typesafe.ai was unreachable when this was written):
 *   - The exact key for a Choice's option list (`options` vs `categories`)
 *   - The auth header format (assumed `Authorization: Bearer <key>`)
 *   - The response envelope (assumed `{ answers: { <name>: {...} } }`)
 *   - The model identifier string
 *
 * parseChoice below therefore accepts several plausible shapes rather than
 * guessing one and failing silently on the others. That tolerance is
 * deliberate scaffolding, not a permanent design - collapse it to the real
 * shape once confirmed.
 */

export interface WireChoiceQuestion {
  type: "choice";
  /** Natural-language framing of what is being decided. */
  prompt: string;
  /** The allowed answers. Written under both plausible key names. */
  options: string[];
  categories: string[];
  /** Per-option plain-language anchors. */
  descriptions?: Record<string, string>;
}

export function buildChoice(
  prompt: string,
  options: readonly string[],
  descriptions?: Record<string, string>,
): WireChoiceQuestion {
  const list = [...options];
  return {
    type: "choice",
    prompt,
    options: list,
    categories: list,
    ...(descriptions ? { descriptions } : {}),
  };
}

export function buildRequestBody(
  state: string,
  model: string,
  questions: Record<string, WireChoiceQuestion>,
): Record<string, unknown> {
  return { model, state, questions };
}

export function authHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/** Pull the per-question answer object out of whatever envelope came back. */
function locateAnswer(body: any, name: string): any {
  if (!body || typeof body !== "object") return undefined;
  return (
    body?.answers?.[name] ??
    body?.questions?.[name] ??
    body?.results?.[name] ??
    body?.[name] ??
    undefined
  );
}

function coerceConfidence(raw: any, distribution?: Record<string, number>): number {
  const direct = raw?.confidence ?? raw?.calibrated_confidence ?? raw?.score;
  if (typeof direct === "number" && Number.isFinite(direct)) {
    // Tolerate a 0..100 scale if that is what the API returns.
    return direct > 1 ? Math.min(direct / 100, 1) : Math.max(direct, 0);
  }
  // Fall back to the winning probability when no explicit confidence is given.
  if (distribution) {
    const best = Math.max(...Object.values(distribution));
    if (Number.isFinite(best)) return best;
  }
  return 0;
}

function coerceDistribution(raw: any): Record<string, number> | undefined {
  const dist =
    raw?.probabilities ?? raw?.distribution ?? raw?.scores ?? raw?.options;
  if (dist && typeof dist === "object" && !Array.isArray(dist)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(dist)) {
      if (typeof v === "number") out[k] = v;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

/**
 * Normalize one Choice answer. Returns null when the value is absent or is not
 * one of the options we supplied - we never invent a category, because an
 * unrecognized value must degrade to the fallback protocol, not to a guess.
 */
export function parseChoice<T extends string>(
  body: unknown,
  name: string,
  allowed: readonly T[],
): { value: T; confidence: number; distribution?: Partial<Record<T, number>> } | null {
  const raw = locateAnswer(body, name);
  if (raw === undefined || raw === null) return null;

  const candidate =
    typeof raw === "string"
      ? raw
      : (raw?.value ?? raw?.choice ?? raw?.selected ?? raw?.category ?? raw?.answer);

  if (typeof candidate !== "string") return null;

  const match = allowed.find((a) => a === candidate);
  if (!match) return null;

  const distribution = coerceDistribution(raw);
  return {
    value: match,
    confidence: coerceConfidence(raw, distribution),
    distribution: distribution as Partial<Record<T, number>> | undefined,
  };
}
