"use client";

/**
 * The single most important element in the app.
 *
 * It is rendered before any API call resolves, on every screen including the
 * idle one, and it is never gated behind a routing decision. If everything else
 * here fails - the network, Jev, the model's judgement - this still works.
 */
export function CallButton({ compact = false }: { compact?: boolean }) {
  const number = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || "911";

  return (
    <a
      href={`tel:${number}`}
      aria-label={`Call emergency services on ${number}`}
      className={[
        "flex w-full items-center justify-center gap-3 rounded-2xl",
        "bg-emergency font-bold text-white shadow-lg",
        "active:scale-[0.98] transition-transform",
        compact ? "min-h-14 px-5 text-lg" : "min-h-[72px] px-6 text-2xl",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={compact ? "size-6" : "size-8"}
        fill="currentColor"
      >
        <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
      </svg>
      Call {number}
    </a>
  );
}
