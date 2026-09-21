"use client";

import type { ProtocolContent } from "@/lib/protocols/content";
import { CallButton } from "@/components/ui/CallButton";
import { Metronome } from "@/components/ui/Metronome";

interface Props {
  content: ProtocolContent;
  /** Why the router landed here. Shown small - never above the protocol itself. */
  rationale?: string;
  degraded?: boolean;
  onReject: () => void;
}

/**
 * Chrome shared by every protocol screen.
 *
 * Two non-negotiables are enforced here rather than per-protocol: the call
 * button sits above the content on every screen, and every screen carries a
 * one-tap escape. The user is the final verifier of the routing decision, so
 * disagreeing with it has to be as easy as accepting it.
 */
export function ProtocolShell({ content, rationale, degraded, onReject }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4">
      <div className="sticky top-0 z-10 -mx-4 bg-surface/95 px-4 pb-3 pt-2 backdrop-blur">
        <CallButton />
      </div>

      <header className="mt-5">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-1 text-lg text-ink-muted">{content.subtitle}</p>

        <button
          type="button"
          onClick={onReject}
          className="mt-4 min-h-12 w-full rounded-xl border-2 border-border-subtle px-4 text-base font-semibold text-ink-muted active:scale-[0.99]"
        >
          Not what&apos;s happening? Choose again →
        </button>

        {degraded && (
          <p className="mt-3 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
            Some details were unclear. Check the heading above matches what you
            are seeing before you act on these steps.
          </p>
        )}
      </header>

      <ol className="mt-6 space-y-3">
        {content.steps.map((step, i) => (
          <li
            key={step.title}
            className={[
              "rounded-2xl border p-4",
              step.critical
                ? "border-emergency/50 bg-emergency/10"
                : "border-border-subtle bg-surface-step",
            ].join(" ")}
          >
            <div className="flex gap-3">
              <span
                className={[
                  "grid size-9 shrink-0 place-items-center rounded-full text-base font-black",
                  step.critical ? "bg-emergency text-white" : "bg-surface-raised text-ink-muted",
                ].join(" ")}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-bold leading-snug">{step.title}</h2>
                {step.detail && (
                  <p className="mt-1.5 text-base leading-relaxed text-ink-muted">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {content.metronome && (
        <div className="mt-6">
          <Metronome />
        </div>
      )}

      {content.neverDo.length > 0 && (
        <section className="mt-6 rounded-2xl border-2 border-emergency/60 bg-emergency/10 p-4">
          <h2 className="text-lg font-black uppercase tracking-wide text-emergency-bright">
            Never
          </h2>
          <ul className="mt-2 space-y-2">
            {content.neverDo.map((item) => (
              <li key={item} className="flex gap-2 text-base leading-relaxed">
                <span aria-hidden="true" className="text-emergency-bright">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-8 space-y-2 border-t border-border-subtle pt-4 text-xs leading-relaxed text-ink-muted">
        {content.provenance.clinicalReview === "pending" && (
          <p className="rounded-lg border border-warn/40 bg-warn/10 p-2 font-semibold text-warn">
            Awaiting clinical sign-off. Not cleared for real-world use.
          </p>
        )}
        <p>
          Source: {content.provenance.source} — {content.provenance.edition}.
          Transcribed {content.provenance.transcribed}.
          {content.provenance.reviewer &&
            ` Reviewed by ${content.provenance.reviewer} on ${content.provenance.reviewedAt}.`}
        </p>
        {rationale && <p className="opacity-70">Routing: {rationale}</p>}
      </footer>
    </div>
  );
}
