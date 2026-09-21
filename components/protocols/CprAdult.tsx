"use client";

import { PROTOCOLS } from "@/lib/protocols/content";
import { ProtocolShell } from "./ProtocolShell";
import type { ProtocolViewProps } from "./types";

export function CprAdult({ rationale, degraded, onReject }: ProtocolViewProps) {
  return (
    <ProtocolShell
      content={PROTOCOLS.cpr_adult}
      rationale={rationale}
      degraded={degraded}
      onReject={onReject}
    />
  );
}
