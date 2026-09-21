"use client";

import { PROTOCOLS } from "@/lib/protocols/content";
import { ProtocolShell } from "./ProtocolShell";
import type { ProtocolViewProps } from "./types";

export function ChokingAdult({ rationale, degraded, onReject }: ProtocolViewProps) {
  return (
    <ProtocolShell
      content={PROTOCOLS.choking_adult}
      rationale={rationale}
      degraded={degraded}
      onReject={onReject}
    />
  );
}
