import type { ProtocolId } from "@/lib/triage/resolve";

/**
 * Every protocol declares where its content came from and whether a clinician
 * has signed it off. This is the backbone of the app's defensibility: the model
 * chooses which of these to show, and nothing else in the system is allowed to
 * author or alter their text at runtime.
 */
export interface Provenance {
  /** Issuing body. */
  source: string;
  /** Guideline edition or programme the steps were transcribed from. */
  edition: string;
  url: string;
  /** ISO date the content was transcribed. */
  transcribed: string;
  /**
   * Gate on going live. Content transcribed from published guidance still has
   * to be read back against the primary source by a qualified clinician before
   * this flips to "approved". The UI shows a banner while any shown protocol
   * is still "pending".
   */
  clinicalReview: "pending" | "approved";
  reviewer?: string;
  reviewedAt?: string;
}

export const AHA_BLS: Provenance = {
  source: "American Heart Association",
  edition: "Guidelines for CPR & Emergency Cardiovascular Care - Basic Life Support, lay rescuer sequence",
  url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines",
  transcribed: "2026-09-21",
  clinicalReview: "pending",
};

export const AHA_CHOKING: Provenance = {
  source: "American Heart Association / American Red Cross",
  edition: "Guidelines for First Aid - relief of foreign-body airway obstruction",
  url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines",
  transcribed: "2026-09-21",
  clinicalReview: "pending",
};

export const STOP_THE_BLEED: Provenance = {
  source: "American College of Surgeons Committee on Trauma",
  edition: "STOP THE BLEED - bleeding control for the injured",
  url: "https://www.stopthebleed.org/",
  transcribed: "2026-09-21",
  clinicalReview: "pending",
};

export const NO_CLINICAL_CONTENT: Provenance = {
  source: "Not applicable",
  edition: "Directs the user to emergency services and gives no clinical instruction",
  url: "",
  transcribed: "2026-09-21",
  clinicalReview: "approved",
};

/** True when every protocol in the registry has been signed off. */
export function allApproved(map: Record<ProtocolId, { provenance: Provenance }>): boolean {
  return Object.values(map).every((p) => p.provenance.clinicalReview === "approved");
}
