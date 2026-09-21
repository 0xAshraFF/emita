import type { AgeBand, Condition, Responsiveness } from "@/lib/triage/taxonomy";

/** A single Jev Choice answer, normalized to the shape the app reasons about. */
export interface ChoiceAnswer<T extends string> {
  value: T;
  /** Calibrated 0..1. Jev derives this from the shape of the probability distribution. */
  confidence: number;
  /** Full distribution when the wire response carries one. Useful for logging. */
  distribution?: Partial<Record<T, number>>;
}

/** The three questions we ask in a single Jev pass. */
export interface TriageAnswers {
  condition: ChoiceAnswer<Condition>;
  age_band: ChoiceAnswer<AgeBand>;
  responsive: ChoiceAnswer<Responsiveness>;
}

export interface TriageDecision {
  answers: TriageAnswers;
  /** Round-trip milliseconds measured at the server, for the latency budget. */
  latencyMs: number;
  /** True when served by the offline mock router rather than the Jev API. */
  mocked: boolean;
}

export class JevError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly raw?: unknown,
  ) {
    super(message);
    this.name = "JevError";
  }
}
