import {
  AGE_BANDS,
  CONDITIONS,
  RESPONSIVENESS,
  type AgeBand,
  type Condition,
  type Responsiveness,
} from "@/lib/triage/taxonomy";
import type { ChoiceAnswer, TriageAnswers } from "./types";

/**
 * Deterministic offline router used when JEV_MOCK=1.
 *
 * This exists so the entire app - voice capture, routing, thresholds, every
 * protocol screen - runs end to end with no API key and no network. It is
 * crude keyword matching and is NOT a model. It must never be reachable in a
 * production build; lib/jev/client.ts enforces that.
 */

const HIT = (text: string, words: string[]) =>
  words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);

function score(text: string): Record<Condition, number> {
  return {
    choking: HIT(text, [
      "chok", "swallow", "throat", "coin", "lodged", "stuck", "inhaled",
      "can't breathe", "cant breathe", "airway", "gagging", "obstruct",
    ]),
    cardiac_arrest: HIT(text, [
      "not breathing", "no pulse", "collapsed", "cardiac", "heart attack",
      "unconscious", "passed out", "gasping", "cpr", "no heartbeat", "drowned",
    ]),
    severe_bleeding: HIT(text, [
      "bleed", "blood", "cut", "stab", "gunshot", "shot", "wound", "gash",
      "hemorrh", "severed", "amputat", "spurting",
    ]),
    unknown: 0,
  };
}

function pick<T extends string>(
  scores: Record<T, number>,
  fallback: T,
): ChoiceAnswer<T> {
  const entries = Object.entries(scores) as [T, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  const second = entries[1];
  if (!top || top[1] === 0) return { value: fallback, confidence: 0.3 };

  const margin = top[1] - (second?.[1] ?? 0);
  // Confidence rises with both absolute evidence and separation from the
  // runner-up. Calibrated so that one unambiguous keyword hit just clears the
  // 0.95 condition gate, and a tie sits well under it.
  const confidence = Math.min(0.72 + margin * 0.14 + top[1] * 0.09, 0.99);
  return { value: top[0], confidence };
}

export function mockTriage(state: string): TriageAnswers {
  const text = state.toLowerCase();

  const condition = pick<Condition>(score(text), "unknown");

  const ageScores: Record<AgeBand, number> = {
    infant: HIT(text, ["infant", "baby", "newborn", "months old", "month old"]),
    child: HIT(text, ["toddler", "child", "kid", "son", "daughter", "little girl", "little boy", "year old"]),
    adult: HIT(text, ["man", "woman", "husband", "wife", "adult", "dad", "mom", "father", "mother", "elderly", "guy"]),
  };
  const age = pick<AgeBand>(ageScores, "adult");

  const responsiveScores: Record<Responsiveness, number> = {
    responsive: HIT(text, ["awake", "conscious", "struggling", "coughing", "panicking", "grabbing", "clutching"]),
    unresponsive: HIT(text, ["unconscious", "passed out", "collapsed", "limp", "won't wake", "wont wake", "unresponsive", "not moving"]),
    unknown: 0,
  };
  const responsive = pick<Responsiveness>(responsiveScores, "unknown");

  // Sanity: never emit a value outside the taxonomy.
  if (!CONDITIONS.includes(condition.value)) condition.value = "unknown";
  if (!AGE_BANDS.includes(age.value)) age.value = "adult";
  if (!RESPONSIVENESS.includes(responsive.value)) responsive.value = "unknown";

  return { condition, age_band: age, responsive };
}
