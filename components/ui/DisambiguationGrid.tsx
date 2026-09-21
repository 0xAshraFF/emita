"use client";

import { useState } from "react";

import type { ProtocolId } from "@/lib/triage/resolve";
import { CallButton } from "./CallButton";

type Branch = "choking" | "cpr" | null;

const AGE_LABELS: { key: "infant" | "child" | "adult"; label: string; hint: string }[] = [
  { key: "infant", label: "Baby", hint: "Under 1 year" },
  { key: "child", label: "Child", hint: "1 to teenager" },
  { key: "adult", label: "Adult", hint: "Teenager or older" },
];

const BIG =
  "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border-subtle bg-surface-step px-4 text-center active:scale-[0.98] transition-transform";

/**
 * Shown when confidence is too low to name a protocol, and when the user taps
 * the "not this" escape.
 *
 * A dead end here would cost more time than the routing saved, so low
 * confidence resolves in at most two taps rather than asking the user to
 * describe the emergency again.
 */
export function DisambiguationGrid({
  onSelect,
  heading = "What is happening?",
}: {
  onSelect: (id: ProtocolId) => void;
  heading?: string;
}) {
  const [branch, setBranch] = useState<Branch>(null);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4">
      <div className="sticky top-0 z-10 -mx-4 bg-surface/95 px-4 pb-3 pt-2 backdrop-blur">
        <CallButton />
      </div>

      <h1 className="mt-6 text-3xl font-black tracking-tight">
        {branch ? "How old are they?" : heading}
      </h1>
      <p className="mt-1 text-base text-ink-muted">
        {branch ? "Tap one. The steps differ a lot by age." : "Tap the closest match."}
      </p>

      {branch === null ? (
        <div className="mt-6 space-y-3">
          <button type="button" className={BIG} onClick={() => setBranch("cpr")}>
            <span className="text-2xl font-black">Not breathing</span>
            <span className="text-sm text-ink-muted">Collapsed, unresponsive, or only gasping</span>
          </button>
          <button type="button" className={BIG} onClick={() => setBranch("choking")}>
            <span className="text-2xl font-black">Choking</span>
            <span className="text-sm text-ink-muted">Awake but cannot breathe, speak or cough</span>
          </button>
          <button
            type="button"
            className={BIG}
            onClick={() => onSelect("bleeding_severe")}
          >
            <span className="text-2xl font-black">Heavy bleeding</span>
            <span className="text-sm text-ink-muted">Blood pouring, spurting or soaking through</span>
          </button>
          <button
            type="button"
            className="min-h-14 w-full rounded-2xl border border-border-subtle px-4 text-base font-semibold text-ink-muted active:scale-[0.99]"
            onClick={() => onSelect("fallback_emergency_call")}
          >
            None of these — talk to a dispatcher
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {AGE_LABELS.map(({ key, label, hint }) => (
            <button
              key={key}
              type="button"
              className={BIG}
              onClick={() =>
                onSelect(
                  (branch === "cpr" ? `cpr_${key}` : `choking_${key}`) as ProtocolId,
                )
              }
            >
              <span className="text-2xl font-black">{label}</span>
              <span className="text-sm text-ink-muted">{hint}</span>
            </button>
          ))}
          <button
            type="button"
            className="min-h-14 w-full rounded-2xl border border-border-subtle px-4 text-base font-semibold text-ink-muted active:scale-[0.99]"
            onClick={() => setBranch(null)}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
