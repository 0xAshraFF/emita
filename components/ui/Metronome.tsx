"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BPM = 110; // Centre of the 100-120/min guideline band.
const INTERVAL_MS = (60 / BPM) * 1000;

/**
 * Compression-rate metronome.
 *
 * Rate adherence is one of the few things a bystander app measurably improves,
 * so this is a clinical feature rather than decoration. It runs on Web Audio
 * (not <audio>, which drifts) and pairs each click with a haptic pulse so it
 * survives a noisy room or a muted phone.
 */
export function Metronome() {
  const [running, setRunning] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const click = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
    navigator.vibrate?.(30);
  }, []);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    // Created lazily inside the user-gesture-initiated render so iOS permits it.
    if (!ctxRef.current && typeof window !== "undefined") {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctor) ctxRef.current = new Ctor();
    }
    void ctxRef.current?.resume();

    click();
    timerRef.current = window.setInterval(click, INTERVAL_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running, click]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface-raised p-4">
      <div
        className={`grid size-14 shrink-0 place-items-center rounded-full bg-emergency ${running ? "beat" : ""}`}
        aria-hidden="true"
      >
        <span className="text-xs font-black text-white">PUSH</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{BPM} per minute</p>
        <p className="text-sm text-ink-muted">Push on every beat. Let the chest rise fully between each.</p>
      </div>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-pressed={running}
        className="min-h-11 shrink-0 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-ink-muted active:scale-95"
      >
        {running ? "Mute" : "Unmute"}
      </button>
    </div>
  );
}
