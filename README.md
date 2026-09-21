# Emita

**Standard AI generates text. Emita emits lifelines.**

Emita routes a panicked, unstructured sentence to a hard-coded, medically-verified
first-aid protocol in under a second. It uses [Jev](https://typesafe.ai) — TypeSafe's
System One decision model — as a pure routing layer.

## The core constraint

**No generative model is on the critical path, and no AI writes medical advice.**

Jev does not generate text. It takes a `state` plus typed questions and returns
calibrated probabilities in a single forward pass. Emita uses it to pick *which* of
eight hard-coded protocol screens to show. What those screens *say* is transcribed
from published guidelines and never touched at runtime.

```
mic → interim transcript → POST /api/triage → Jev → local React protocol component
```

One third-party call. One of ours. No LLM anywhere.

## Architecture

```
app/
  page.tsx                  Orchestrates capture → routing → protocol
  api/triage/route.ts       Edge route. Holds the API key server-side.
lib/
  triage/taxonomy.ts        The 3 questions, their option descriptions, thresholds
  triage/resolve.ts         Answers → protocol id. The safety-critical logic.
  jev/wire.ts               THE ONLY FILE THAT KNOWS THE JEV WIRE FORMAT
  jev/client.ts             fetch, timeout, auth, error handling
  jev/mock.ts               Offline keyword router for development
  protocols/content.ts      All medical content, one record per protocol
  protocols/provenance.ts   Source + clinical sign-off state per protocol
components/
  protocols/                One component per protocol + shared ProtocolShell
  ui/                       CallButton, Metronome, DisambiguationGrid, EmergencyCapture
hooks/
  useSpeech.ts              Web Speech API with interim results
  useTriage.ts              Speculative routing state machine
```

### The routing taxonomy

Three `Choice` questions, all answered in **one** Jev pass:

| Question | Options |
|---|---|
| `condition` | `choking` · `cardiac_arrest` · `severe_bleeding` · `unknown` |
| `age_band` | `infant` · `child` · `adult` |
| `responsive` | `responsive` · `unresponsive` · `unknown` |

`condition × age_band` resolves to one of eight protocol screens. This mirrors how
real BLS algorithms branch — age and responsiveness *are* the decision points — and
it closes the coverage gaps a flat four-category taxonomy leaves (infant cardiac
arrest, adult choking).

`responsive` drives one clinical crossover: a choking victim who has gone
unresponsive is routed to CPR, per published guidance.

### Thresholds

| Gate | Value | Behaviour below it |
|---|---|---|
| `condition` | 0.95 | Fall back to the two-tap disambiguation grid |
| `age` | 0.75 | Keep the condition, show the safest age variant, flag as degraded |
| `responsiveness` | 0.80 | No crossover; stay on the chosen condition |

Age degrades *within* a condition rather than discarding it — knowing someone is
choking is useful even when their age is ambiguous.

### Where the seconds actually come from

The Jev call is already the cheapest stage (~200ms). The wins are elsewhere:

- **Speculative routing.** `useTriage` fires on *interim* transcripts once three
  words have landed, rather than waiting for the user to stop speaking. Calls are
  raced and superseded. A speculative result is accepted only when two consecutive
  calls agree on the same protocol — a half-spoken "my son swallowed…" reads as
  choking until "…and stopped breathing" arrives. Jev bills input only and returns
  no output tokens, so several calls per emergency cost effectively nothing.
- **Installable PWA.** App-open time (3–5s) dominates everything else. The manifest
  makes Emita a home-screen icon.
- **Local protocol components.** Zero render latency once routed, and they work with
  no network.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Out of the box `JEV_MOCK=1` runs a deterministic keyword router, so the whole app
works with no API key. To use the real API, set `JEV_API_KEY` and `JEV_MOCK=0`.

```bash
npm test         # resolution logic
npm run build    # production build
npm run typecheck
```

## ⚠️ Before this touches a real user

Two blockers, both tracked in code:

1. **The Jev wire format is unverified.** `docs.typesafe.ai` was unreachable when
   this was written. The endpoint, the `state`/`model`/`questions` body shape, the
   three primitives and the 0–1 confidence are confirmed from TypeSafe's public
   material. The exact Choice option key, the auth header and the response envelope
   are assumptions. `lib/jev/wire.ts` currently tolerates several plausible shapes;
   collapse it to the real one. **It is the only file that needs to change.**

2. **No protocol has clinical sign-off.** Every entry in `lib/protocols/provenance.ts`
   is `clinicalReview: "pending"`, and the UI shows a warning banner while that is
   true. The content is transcribed from AHA / Red Cross / Stop the Bleed guidance to
   the best of our ability, but it has not been read back against the primary sources
   by a qualified clinician. See [docs/SAFETY.md](docs/SAFETY.md).

**Emita is not a substitute for emergency services.** See [docs/SAFETY.md](docs/SAFETY.md)
for the safety model and the regulatory position.
