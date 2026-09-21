import assert from "node:assert/strict";
import { test } from "node:test";

import type { TriageAnswers } from "@/lib/jev/types";
import { resolve } from "@/lib/triage/resolve";
import { THRESHOLDS } from "@/lib/triage/taxonomy";

/**
 * These cover the routing decisions where a mistake is dangerous. The model is
 * not under test here - the gating and the clinical crossover are.
 */

function answers(partial: {
  condition: [TriageAnswers["condition"]["value"], number];
  age?: [TriageAnswers["age_band"]["value"], number];
  responsive?: [TriageAnswers["responsive"]["value"], number];
}): TriageAnswers {
  return {
    condition: { value: partial.condition[0], confidence: partial.condition[1] },
    age_band: { value: partial.age?.[0] ?? "adult", confidence: partial.age?.[1] ?? 0.9 },
    responsive: {
      value: partial.responsive?.[0] ?? "unknown",
      confidence: partial.responsive?.[1] ?? 0.9,
    },
  };
}

test("routes a confident condition and age to the matching protocol", () => {
  const r = resolve(answers({ condition: ["choking", 0.98], age: ["infant", 0.96] }));
  assert.equal(r.protocol, "choking_infant");
  assert.equal(r.degraded, false);
});

test("condition below threshold falls back rather than guessing", () => {
  const r = resolve(
    answers({ condition: ["cardiac_arrest", THRESHOLDS.condition - 0.01], age: ["adult", 0.99] }),
  );
  assert.equal(r.protocol, "fallback_emergency_call");
  assert.equal(r.degraded, true);
});

test("an unknown condition always falls back, whatever its confidence", () => {
  const r = resolve(answers({ condition: ["unknown", 0.999] }));
  assert.equal(r.protocol, "fallback_emergency_call");
});

test("unclear age keeps the condition and degrades to the safe variant", () => {
  const r = resolve(
    answers({ condition: ["choking", 0.99], age: ["infant", THRESHOLDS.age - 0.01] }),
  );
  // Still a choking protocol - a correct condition is not thrown away.
  assert.equal(r.protocol, "choking_adult");
  assert.equal(r.degraded, true);
});

test("an unresponsive choking victim crosses over to CPR", () => {
  const r = resolve(
    answers({
      condition: ["choking", 0.98],
      age: ["infant", 0.97],
      responsive: ["unresponsive", 0.95],
    }),
  );
  assert.equal(r.protocol, "cpr_infant");
  assert.equal(r.crossover, "choking_to_arrest");
});

test("crossover requires confident unresponsiveness", () => {
  const r = resolve(
    answers({
      condition: ["choking", 0.98],
      age: ["child", 0.97],
      responsive: ["unresponsive", THRESHOLDS.responsiveness - 0.01],
    }),
  );
  assert.equal(r.protocol, "choking_child");
  assert.equal(r.crossover, undefined);
});

test("a responsive victim never crosses over to CPR", () => {
  const r = resolve(
    answers({
      condition: ["choking", 0.99],
      age: ["adult", 0.99],
      responsive: ["responsive", 0.99],
    }),
  );
  assert.equal(r.protocol, "choking_adult");
});

test("severe bleeding ignores the age axis", () => {
  for (const age of ["infant", "child", "adult"] as const) {
    const r = resolve(answers({ condition: ["severe_bleeding", 0.99], age: [age, 0.99] }));
    assert.equal(r.protocol, "bleeding_severe");
  }
});

test("every resolution carries a non-empty rationale", () => {
  const r = resolve(answers({ condition: ["cardiac_arrest", 0.99], age: ["child", 0.99] }));
  assert.ok(r.rationale.length > 0);
});
