"use client";

import { useCallback, useState } from "react";

import { PROTOCOL_VIEWS } from "@/components/protocols";
import { DisambiguationGrid } from "@/components/ui/DisambiguationGrid";
import { EmergencyCapture } from "@/components/ui/EmergencyCapture";
import { useSpeech } from "@/hooks/useSpeech";
import { useTriage } from "@/hooks/useTriage";
import type { ProtocolId } from "@/lib/triage/resolve";

export default function Home() {
  const [manual, setManual] = useState(false);
  const { phase, result, elapsedMs, begin, feed, override, reset } = useTriage();

  const onTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      void feed(text, isFinal);
    },
    [feed],
  );

  const speech = useSpeech({ onTranscript });

  const start = useCallback(() => {
    setManual(false);
    begin();
    speech.start();
  }, [begin, speech]);

  const submitTyped = useCallback(
    (text: string) => {
      setManual(false);
      begin();
      void feed(text, true);
    },
    [begin, feed],
  );

  const choose = useCallback(
    (id: ProtocolId) => {
      speech.stop();
      setManual(false);
      override(id);
    },
    [override, speech],
  );

  const startOver = useCallback(() => {
    speech.stop();
    reset();
    setManual(true);
  }, [reset, speech]);

  if (manual) {
    return <DisambiguationGrid onSelect={choose} />;
  }

  if (phase === "resolved" && result) {
    // Low confidence never dead-ends. Rather than showing the generic fallback
    // and stopping, offer the two-tap grid - it resolves faster than asking the
    // user to describe the emergency a second time.
    if (result.protocol === "fallback_emergency_call" && result.degraded) {
      return (
        <DisambiguationGrid
          onSelect={choose}
          heading="We could not tell. Which is it?"
        />
      );
    }

    const View = PROTOCOL_VIEWS[result.protocol];
    return (
      <>
        <View
          rationale={
            elapsedMs !== null
              ? `${result.rationale} Routed in ${elapsedMs}ms${result.mocked ? " (mock router)" : ""}.`
              : result.rationale
          }
          degraded={result.degraded}
          onReject={startOver}
        />
      </>
    );
  }

  return (
    <EmergencyCapture
      phase={phase}
      speechState={speech.state}
      speechError={speech.error}
      transcript={speech.transcript}
      onStart={start}
      onTypedSubmit={submitTyped}
      onChooseManually={() => setManual(true)}
    />
  );
}
