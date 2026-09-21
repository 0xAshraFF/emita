"use client";

import { useCallback, useRef, useState } from "react";

import type { TriageResponse } from "@/app/api/triage/route";
import { manualResolution, type ProtocolId } from "@/lib/triage/resolve";

export type TriagePhase = "idle" | "listening" | "deciding" | "resolved";

/** Do not spend a call on a fragment too short to carry any signal. */
const MIN_WORDS = 3;
/** Floor between speculative calls so a fast talker cannot spam the endpoint. */
const MIN_INTERVAL_MS = 350;

export function useTriage() {
  const [phase, setPhase] = useState<TriagePhase>("idle");
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const startedAt = useRef<number>(0);
  const lastSentAt = useRef<number>(0);
  const lastSentText = useRef<string>("");
  const inflight = useRef<AbortController | null>(null);
  /**
   * A speculative (interim) result is only trusted once two consecutive calls
   * agree on the same protocol. A single high-confidence read of a half-spoken
   * sentence is exactly the case where the transcript is still changing under
   * us - "my son swallowed" reads as choking before "...and stopped breathing"
   * arrives.
   */
  const pendingCandidate = useRef<ProtocolId | null>(null);
  const settled = useRef(false);

  const reset = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    pendingCandidate.current = null;
    settled.current = false;
    lastSentText.current = "";
    lastSentAt.current = 0;
    setResult(null);
    setElapsedMs(null);
    setPhase("idle");
  }, []);

  const begin = useCallback(() => {
    reset();
    startedAt.current = Date.now();
    setPhase("listening");
  }, [reset]);

  const accept = useCallback((payload: TriageResponse) => {
    settled.current = true;
    inflight.current?.abort();
    inflight.current = null;
    setResult(payload);
    setElapsedMs(Date.now() - startedAt.current);
    setPhase("resolved");
  }, []);

  /**
   * Feed a transcript - interim or final - into the router.
   *
   * Interim calls are fired speculatively and raced. Jev bills input only and
   * returns no output tokens, so three or four calls per emergency is
   * financially irrelevant next to the second or two of wall clock it removes.
   */
  const feed = useCallback(
    async (text: string, isFinal: boolean) => {
      if (settled.current) return;

      const trimmed = text.trim();
      if (!isFinal) {
        if (trimmed.split(/\s+/).length < MIN_WORDS) return;
        if (trimmed === lastSentText.current) return;
        if (Date.now() - lastSentAt.current < MIN_INTERVAL_MS) return;
      }

      lastSentText.current = trimmed;
      lastSentAt.current = Date.now();

      // Supersede any speculative call still in flight - its transcript is stale.
      inflight.current?.abort();
      const controller = new AbortController();
      inflight.current = controller;

      setPhase((p) => (p === "resolved" ? p : "deciding"));

      let payload: TriageResponse;
      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
          signal: controller.signal,
        });
        payload = (await res.json()) as TriageResponse;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // The network is gone. The fallback screen still works offline - it is
        // a local component - and it leads with the call button.
        if (isFinal) {
          accept({
            ...manualResolution("fallback_emergency_call"),
            rationale: "No connection to the routing service.",
            degraded: true,
            latencyMs: 0,
            mocked: false,
          });
        }
        return;
      }

      if (settled.current || controller.signal.aborted) return;

      // A final transcript is the last word we will get - take whatever it says,
      // including a fallback.
      if (isFinal) {
        accept(payload);
        return;
      }

      if (payload.degraded) {
        pendingCandidate.current = null;
        return;
      }

      if (pendingCandidate.current === payload.protocol) {
        accept(payload);
      } else {
        pendingCandidate.current = payload.protocol;
      }
    },
    [accept],
  );

  /** The "not this" escape and the disambiguation grid both land here. */
  const override = useCallback(
    (protocol: ProtocolId) => {
      settled.current = true;
      inflight.current?.abort();
      setResult({ ...manualResolution(protocol), latencyMs: 0, mocked: false });
      setPhase("resolved");
    },
    [],
  );

  return { phase, result, elapsedMs, begin, feed, override, reset };
}
