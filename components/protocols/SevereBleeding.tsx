"use client";

import { PROTOCOLS } from "@/lib/protocols/content";
import { ProtocolShell } from "./ProtocolShell";
import type { ProtocolViewProps } from "./types";

export function SevereBleeding({ rationale, degraded, onReject }: ProtocolViewProps) {
  return (
    <ProtocolShell
      content={PROTOCOLS.bleeding_severe}
      rationale={rationale}
      degraded={degraded}
      onReject={onReject}
    />
  );
}
