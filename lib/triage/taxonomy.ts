/**
 * The triage taxonomy.
 *
 * These three axes are the ONLY things Jev is ever asked to decide. Jev selects
 * *which* medically-verified protocol to display. It never decides *what* that
 * protocol says - that content is hard-coded in components/protocols and sourced
 * from published guidelines (see lib/protocols/provenance.ts).
 *
 * Condition x age resolves to a protocol variant. Responsiveness is not part of
 * the matrix key; it switches a victim between the choking and cardiac-arrest
 * branches, because an unresponsive choking victim is handled as an arrest.
 */

export const CONDITIONS = [
  "choking",
  "cardiac_arrest",
  "severe_bleeding",
  "unknown",
] as const;

export const AGE_BANDS = ["infant", "child", "adult"] as const;

export const RESPONSIVENESS = ["responsive", "unresponsive", "unknown"] as const;

export type Condition = (typeof CONDITIONS)[number];
export type AgeBand = (typeof AGE_BANDS)[number];
export type Responsiveness = (typeof RESPONSIVENESS)[number];

/**
 * Plain-language descriptions handed to Jev alongside each option. The model
 * sees panicked, unstructured speech; these anchor each category in the words a
 * bystander actually uses rather than clinical terminology.
 */
export const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  choking:
    "Something is blocking the airway. Swallowed or inhaled an object, food, a coin, a toy. Cannot breathe, cannot speak, cannot cough, clutching the throat, turning blue while still having a heartbeat.",
  cardiac_arrest:
    "Collapsed and is not breathing normally, or only gasping. No signs of life, no pulse, unresponsive and not breathing. Heart attack that led to collapse. Drowning or overdose victim who is not breathing.",
  severe_bleeding:
    "Heavy or uncontrolled bleeding from a wound. Blood spurting, pouring, or soaking through cloth. A deep cut, a stabbing, a gunshot, a crush injury, an amputation.",
  unknown:
    "The emergency is unclear, is none of the above, or the description does not contain enough information to tell which of the other categories applies.",
};

export const AGE_DESCRIPTIONS: Record<AgeBand, string> = {
  infant: "Under one year old. A baby, a newborn, an infant.",
  child:
    "Roughly one year old up to puberty. A toddler, a kid, a young child, a schoolchild.",
  adult:
    "Adolescent through adult, or any person whose age is not indicated in the description.",
};

export const RESPONSIVENESS_DESCRIPTIONS: Record<Responsiveness, string> = {
  responsive:
    "Awake or reacting in some way. Conscious, moving, struggling, panicking, coughing, trying to speak, or gripping their throat.",
  unresponsive:
    "Not awake and not reacting. Passed out, collapsed, limp, unconscious, will not wake up, does not respond to shouting or shaking.",
  unknown: "The description does not say whether the person is awake or reacting.",
};

/**
 * Confidence gates.
 *
 * A calibrated 0.95 still means roughly one in twenty high-confidence routes is
 * wrong, so these thresholds are one layer of safety - never the only one. The
 * UI keeps the emergency-call button on screen at all times and gives every
 * protocol a one-tap "not this" escape. See docs/SAFETY.md.
 */
export const THRESHOLDS = {
  /** Below this, we do not name a condition at all; we show the fallback. */
  condition: 0.95,
  /**
   * Age only selects a variant within an already-chosen condition. Below this
   * we fall back to the safest variant for that condition rather than dropping
   * the user to the generic fallback - knowing someone is choking is useful
   * even when the age is ambiguous.
   */
  age: 0.75,
  /** Used only to move a victim between the choking and arrest branches. */
  responsiveness: 0.8,
} as const;

/**
 * When age confidence is below THRESHOLDS.age we still have to render something.
 * We pick the variant whose technique is least likely to cause harm if the age
 * guess is wrong. Adult technique on an infant can injure; infant/child
 * technique is gentler, so ambiguity resolves downward - except where the
 * description gives us nothing at all, in which case adult is the base rate.
 */
export const AGE_FALLBACK: Record<Exclude<Condition, "unknown">, AgeBand> = {
  choking: "adult",
  cardiac_arrest: "adult",
  severe_bleeding: "adult",
};
