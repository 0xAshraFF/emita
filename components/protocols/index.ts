import type { ComponentType } from "react";

import type { ProtocolId } from "@/lib/triage/resolve";
import { ChokingAdult } from "./ChokingAdult";
import { ChokingChild } from "./ChokingChild";
import { ChokingInfant } from "./ChokingInfant";
import { CprAdult } from "./CprAdult";
import { CprChild } from "./CprChild";
import { CprInfant } from "./CprInfant";
import { FallbackEmergencyCall } from "./FallbackEmergencyCall";
import { SevereBleeding } from "./SevereBleeding";
import type { ProtocolViewProps } from "./types";

/**
 * The registry Jev routes into. Every id in ProtocolId must appear here - the
 * Record type makes a missing protocol a compile error rather than a blank
 * screen in front of someone doing CPR.
 */
export const PROTOCOL_VIEWS: Record<ProtocolId, ComponentType<ProtocolViewProps>> = {
  choking_infant: ChokingInfant,
  choking_child: ChokingChild,
  choking_adult: ChokingAdult,
  cpr_infant: CprInfant,
  cpr_child: CprChild,
  cpr_adult: CprAdult,
  bleeding_severe: SevereBleeding,
  fallback_emergency_call: FallbackEmergencyCall,
};

export type { ProtocolViewProps };
