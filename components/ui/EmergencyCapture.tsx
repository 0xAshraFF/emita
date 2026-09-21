"use client";

import { useState } from "react";

import type { SpeechState } from "@/hooks/useSpeech";
import type { TriagePhase } from "@/hooks/useTriage";
import { CallButton } from "./CallButton";

interface Props {
  phase: TriagePhase;
  speechState: SpeechState;
  speechError: string | null;
  transcript: string;
  onStart: () => void;
  onTypedSubmit: (text: string) => void;
  onChooseManually: () => void;
}

export function EmergencyCapture({
  phase,
  speechState,
  speechError,
  transcript,
  onStart,
  onTypedSubmit,
  onChooseManually,
}: Props) {
  const [typed, setTyped] = useState("");
  const listening = phase === "listening" || phase === "deciding";
  const voiceUnavailable = speechState === "unsupported" || speechState === "error";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-8 pt-4">
      {/* On screen before anything else loads, and before any decision is made. */}
      <CallButton />

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        {!voiceUnavailable && (
          <div className="relative grid place-items-center">
            {listening && (
              <span
                aria-hidden="true"
                className="pulse-ring absolute size-56 rounded-full bg-emergency"
              />
            )}
            <button
              type="button"
              onClick={onStart}
              disabled={listening}
              aria-label="Hold to describe the emergency out loud"
              className="relative grid size-56 place-items-center rounded-full bg-emergency text-white shadow-2xl transition-transform active:scale-95 disabled:opacity-90"
            >
              <span className="flex flex-col items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-16" fill="currentColor" aria-hidden="true">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
                  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.9V21a1 1 0 1 0 2 0v-3.1A7 7 0 0 0 19 11z" />
                </svg>
                <span className="text-xl font-black">
                  {listening ? "Listening…" : "Speak"}
                </span>
              </span>
            </button>
          </div>
        )}

        <p className="mt-8 max-w-sm text-center text-lg text-ink-muted">
          {listening
            ? "Say what you see. Keep talking — it starts working before you finish."
            : voiceUnavailable
              ? "Type what is happening."
              : "Tap and say what is happening."}
        </p>

        {transcript && (
          <p className="mt-4 max-w-md rounded-2xl border border-border-subtle bg-surface-step px-4 py-3 text-center text-lg">
            {transcript}
          </p>
        )}

        {phase === "deciding" && (
          <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-ink-muted">
            Routing…
          </p>
        )}

        {speechError && (
          <p className="mt-4 max-w-sm text-center text-sm text-warn">{speechError}</p>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) onTypedSubmit(typed.trim());
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="or type it here"
          aria-label="Describe the emergency"
          className="min-h-14 flex-1 rounded-2xl border border-border-subtle bg-surface-step px-4 text-lg outline-none placeholder:text-ink-muted focus:border-emergency"
        />
        <button
          type="submit"
          className="min-h-14 rounded-2xl bg-surface-raised px-5 text-lg font-bold active:scale-95"
        >
          Go
        </button>
      </form>

      <button
        type="button"
        onClick={onChooseManually}
        className="mt-3 min-h-12 w-full rounded-2xl border border-border-subtle text-base font-semibold text-ink-muted active:scale-[0.99]"
      >
        Skip — choose from a list
      </button>
    </main>
  );
}
