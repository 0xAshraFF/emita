"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechState = "unsupported" | "idle" | "listening" | "error";

interface UseSpeechOptions {
  /**
   * Fired on every recognition update, including interim ones. Interim results
   * arrive within a few hundred milliseconds of speech, which is what lets the
   * app start routing before the user has finished their sentence.
   */
  onTranscript: (text: string, isFinal: boolean) => void;
  lang?: string;
}

export function useSpeech({ onTranscript, lang = "en-US" }: UseSpeechOptions) {
  const [state, setState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Held in a ref so restarting recognition never re-subscribes stale handlers.
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!supported) {
      setState("unsupported");
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition!;
    const recognition = new Ctor();
    recognition.lang = lang;
    // Keep the mic open across pauses - a panicking person does not speak in
    // one clean burst, and a premature stop loses the rest of the sentence.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) finalText += alt.transcript;
        else interimText += alt.transcript;
      }

      const combined = (finalText + " " + interimText).trim();
      if (!combined) return;

      setTranscript(combined);
      // A result is only "final" once the engine has stopped revising it and
      // nothing interim is still pending.
      callbackRef.current(combined, Boolean(finalText) && !interimText);
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are routine, not failures worth showing.
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Type instead, or allow the mic in your browser settings."
          : `Voice input failed (${event.error}). Type instead.`,
      );
      setState("error");
    };

    recognition.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = recognition;
    setState("idle");

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already torn down */
      }
    };
  }, [supported, lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    setTranscript("");
    try {
      recognition.start();
      setState("listening");
    } catch {
      // start() throws if already running; that is harmless.
      setState("listening");
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* not running */
    }
    setState("idle");
  }, []);

  return { state, transcript, error, supported, start, stop };
}
