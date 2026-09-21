"use client";

import { PROTOCOLS } from "@/lib/protocols/content";
import { ProtocolShell } from "./ProtocolShell";
import type { ProtocolViewProps } from "./types";

export function FallbackEmergencyCall({ rationale, degraded, onReject }: ProtocolViewProps) {
  return (
    <ProtocolShell
      content={PROTOCOLS.fallback_emergency_call}
      rationale={rationale}
      degraded={degraded}
      onReject={onReject}
    />
  );
}
