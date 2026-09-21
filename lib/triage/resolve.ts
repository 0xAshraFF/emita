import type { TriageAnswers } from "@/lib/jev/types";
import {
  AGE_FALLBACK,
  THRESHOLDS,
  type AgeBand,
  type Condition,
} from "./taxonomy";

/** Every screen the app can land on. One id per hard-coded protocol component. */
export const PROTOCOL_IDS = [
  "choking_infant",
  "choking_child",
  "choking_adult",
  "cpr_infant",
  "cpr_child",
  "cpr_adult",
  "bleeding_severe",
  "fallback_emergency_call",
] as const;

export type ProtocolId = (typeof PROTOCOL_IDS)[number];

export interface Resolution {
  protocol: ProtocolId;
  /** Why we landed here, rendered in the UI so the decision is never opaque. */
  rationale: string;
  /** True when a threshold was missed and we degraded rather than routed. */
  degraded: boolean;
  /** Set when responsiveness moved the victim off the condition Jev picked. */
  crossover?: "choking_to_arrest";
  answers: TriageAnswers;
}

const CHOKING_BY_AGE: Record<AgeBand, ProtocolId> = {
  infant: "choking_infant",
  child: "choking_child",
  adult: "choking_adult",
};

const CPR_BY_AGE: Record<AgeBand, ProtocolId> = {
  infant: "cpr_infant",
  child: "cpr_child",
  adult: "cpr_adult",
};

function resolveAge(
  answers: TriageAnswers,
  condition: Exclude<Condition, "unknown">,
): { age: AgeBand; confident: boolean } {
  const { value, confidence } = answers.age_band;
  if (confidence >= THRESHOLDS.age) return { age: value, confident: true };
  return { age: AGE_FALLBACK[condition], confident: false };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Turn three calibrated answers into one screen.
 *
 * The ordering matters. Condition is gated hardest because naming the wrong
 * emergency is the most dangerous failure - chest compressions on a choking
 * victim who still has a pulse, or back blows during a cardiac arrest. Age only
 * selects a variant inside an already-chosen condition, so it degrades to the
 * safest variant instead of discarding a correct condition.
 */
export function resolve(answers: TriageAnswers): Resolution {
  const { condition, responsive } = answers;

  if (condition.value === "unknown") {
    return {
      protocol: "fallback_emergency_call",
      rationale: "The description did not clearly match a protocol we carry.",
      degraded: true,
      answers,
    };
  }

  if (condition.confidence < THRESHOLDS.condition) {
    return {
      protocol: "fallback_emergency_call",
      rationale: `Best match was "${condition.value}" at ${pct(condition.confidence)} confidence, below the ${pct(THRESHOLDS.condition)} bar required to show a protocol.`,
      degraded: true,
      answers,
    };
  }

  const certain = condition.value as Exclude<Condition, "unknown">;

  /**
   * Clinical crossover. A choking victim who has gone unresponsive is no longer
   * managed with back blows or abdominal thrusts - published guidance moves them
   * to CPR, checking the mouth for the object before each set of breaths. This
   * is the one place where responsiveness overrides the chosen condition, and it
   * only ever moves in the direction of starting compressions.
   */
  if (
    certain === "choking" &&
    responsive.value === "unresponsive" &&
    responsive.confidence >= THRESHOLDS.responsiveness
  ) {
    const { age, confident } = resolveAge(answers, "cardiac_arrest");
    return {
      protocol: CPR_BY_AGE[age],
      rationale: `Choking was identified, but the person is reported unresponsive (${pct(responsive.confidence)}). An unresponsive choking victim is managed as a cardiac arrest.`,
      degraded: !confident,
      crossover: "choking_to_arrest",
      answers,
    };
  }

  if (certain === "severe_bleeding") {
    return {
      protocol: "bleeding_severe",
      rationale: `Severe bleeding identified at ${pct(condition.confidence)} confidence.`,
      degraded: false,
      answers,
    };
  }

  const { age, confident } = resolveAge(answers, certain);
  const table = certain === "choking" ? CHOKING_BY_AGE : CPR_BY_AGE;

  return {
    protocol: table[age],
    rationale: confident
      ? `${certain.replace("_", " ")} identified at ${pct(condition.confidence)}, age band "${age}" at ${pct(answers.age_band.confidence)}.`
      : `${certain.replace("_", " ")} identified at ${pct(condition.confidence)}, but age was unclear (${pct(answers.age_band.confidence)}). Showing the ${age} protocol - confirm the age and switch if needed.`,
    degraded: !confident,
    answers,
  };
}

/** Used by the "not this" escape and the low-confidence disambiguation grid. */
export function manualResolution(protocol: ProtocolId): Resolution {
  return {
    protocol,
    rationale: "Selected by hand.",
    degraded: false,
    answers: {
      condition: { value: "unknown", confidence: 1 },
      age_band: { value: "adult", confidence: 1 },
      responsive: { value: "unknown", confidence: 1 },
    },
  };
}
