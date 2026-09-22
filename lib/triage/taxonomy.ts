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
 * Question instructions.
 *
 * Question names (`condition`, `age_band`, `responsive`) are for our code and
 * are never sent to the model, so each instruction has to carry its full
 * meaning alone. The age and responsiveness questions are speculative with
 * respect to the condition - all three are answered in parallel over the same
 * state and cannot see one another - so each states its own premise.
 */
export const QUESTION_INSTRUCTIONS = {
  condition:
    "A bystander is describing a medical emergency as it happens, in panicked and unstructured words. Which single emergency are they describing? Choose the no-match outcome unless the description clearly indicates one of the others.",
  age_band:
    "A bystander is describing a medical emergency as it happens. How old is the person the emergency is happening to? Judge from any age, relationship or descriptive word in the text. If the text gives no indication of age at all, answer adult.",
  responsive:
    "A bystander is describing a medical emergency as it happens. Is the person the emergency is happening to awake and reacting? Answer only from what the description says; choose the no-match outcome if it does not indicate either way.",
} as const;

/**
 * Choice criteria: the label set AND its definitions in one map.
 *
 * These use structured objects rather than bare strings because the contrasts
 * are the clinically important part. Choking and cardiac arrest share almost
 * all of their surface vocabulary ("not breathing", "turning blue") and differ
 * on one thing - whether the heart is still beating - so each label states
 * explicitly what it excludes.
 */
export const CONDITION_CRITERIA = {
  choking: {
    definition:
      "Something is physically blocking the airway. The heart is still beating.",
    examples:
      "Swallowed or inhaled an object, food, a coin, a toy, a grape. Cannot breathe, speak or cough. Clutching or pointing at the throat. Going blue while still awake or still moving.",
    not: "Not this if the person collapsed with no airway obstruction described.",
  },
  cardiac_arrest: {
    definition:
      "The heart has stopped or the person has collapsed and is not breathing normally. No airway obstruction is described.",
    examples:
      "Collapsed and not breathing. Only gasping or agonal breaths. No pulse, no signs of life. A heart attack that led to collapse. A drowning or overdose victim who is not breathing.",
    not: "Not this if an object is described as blocking the airway - that is choking, even when they are also not breathing.",
  },
  severe_bleeding: {
    definition: "Heavy or uncontrolled blood loss from a wound.",
    examples:
      "Blood spurting, pouring, or soaking through cloth. A deep cut, a stabbing, a gunshot, a crush injury, an amputation.",
    not: "Not this for minor cuts or grazes that are not bleeding heavily.",
  },
  unknown: {
    definition:
      "The no-match outcome. The emergency is unclear, is none of the above, or the description does not contain enough information to tell which of the others applies.",
    examples:
      "A bare call for help. A described symptom with no emergency named. Anything ambiguous between two of the other options.",
    not: "",
  },
} as const;

export const AGE_CRITERIA = {
  infant: "Under one year old. A baby, a newborn, an infant, an age given in months.",
  child:
    "Roughly one year old up to puberty. A toddler, a kid, a young child, a schoolchild, a son or daughter described as young, an age given in single-digit years.",
  adult:
    "Adolescent through adult, including the elderly. Also the answer when the description gives no indication of age at all.",
} as const;

export const RESPONSIVENESS_CRITERIA = {
  responsive:
    "Awake or reacting in some way. Conscious, moving, struggling, panicking, coughing, trying to speak, or gripping their throat.",
  unresponsive:
    "Not awake and not reacting. Passed out, collapsed, limp, unconscious, will not wake up, does not respond to shouting or shaking.",
  unknown:
    "The no-match outcome. The description does not say whether the person is awake or reacting.",
} as const;

/**
 * Confidence gates.
 *
 * IMPORTANT: Choice confidence summarizes how concentrated the probability
 * distribution is, NOT the probability that the answer is correct and NOT
 * permission to act. A confident model can be confidently wrong, and probability
 * can also spread simply because two labels genuinely both fit. So these numbers
 * gate how much of the UI we commit to - they are never the safety mechanism on
 * their own. The emergency-call button is on screen at all times and every
 * protocol carries a one-tap "not this" escape. See docs/SAFETY.md.
 *
 * These values are placeholders. TypeSafe's guidance is explicit that thresholds
 * must be evaluated against real data and the real consequences of each error.
 * That evaluation has not been done - see docs/SAFETY.md "Known gaps".
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

/**
 * Compile-time guards: the criteria maps ARE the label sets sent to Jev, so a
 * key added to one and not the other would silently change what the model can
 * answer. These assertions make that a type error in both directions.
 */
type Exact<A extends string, B extends string> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : never
  : never;

const _conditionsMatch: Exact<Condition, keyof typeof CONDITION_CRITERIA> = true;
const _agesMatch: Exact<AgeBand, keyof typeof AGE_CRITERIA> = true;
const _responsivenessMatch: Exact<Responsiveness, keyof typeof RESPONSIVENESS_CRITERIA> = true;
void _conditionsMatch;
void _agesMatch;
void _responsivenessMatch;
