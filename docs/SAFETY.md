# Safety model

## What confidence does and does not mean

**Correction to an earlier version of this document.** Choice confidence
summarizes **how concentrated the probability distribution is** — not the
probability that the answer is correct, and not permission to act. TypeSafe's
guidance is explicit on this. Two consequences:

- A confident model can be confidently wrong. 0.98 is not "98% likely correct."
- Low confidence is not automatically alarming. Probability also spreads when
  two labels genuinely both fit — which, for "is this choking or cardiac
  arrest," is a real and clinically meaningful tie rather than model failure.

So the thresholds here gate **how much of the UI we commit to**. They are not a
correctness guarantee and they are not the safety mechanism.

The misroutes we are defending against:

| Misroute | Harm |
|---|---|
| Choking → CPR | Chest compressions on someone who still has a pulse |
| Cardiac arrest → choking | Back blows instead of compressions; delay kills |
| Bleeding → anything else | They bleed out while following the wrong steps |

These are the actual layers, and none of them are optional:

### 1. The call button is never gated

`components/ui/CallButton.tsx` renders on **every** screen — the idle screen, the
disambiguation grid, every protocol — and it is painted before any API call
resolves. If the network, Jev, or the model's judgement fails, this still works.

### 2. The user is the final verifier

Every protocol leads with a large, unambiguous heading (`CPR — Infant`) and a
full-width **"Not what's happening? Choose again →"** escape directly beneath it.
Disagreeing with the router must be as cheap as accepting it. A route the user
cannot see is a route they cannot correct.

### 3. Low confidence resolves in two taps, not a dead end

Falling back to "call 911 and good luck" would cost more time than the routing
saved. `DisambiguationGrid` resolves any emergency in at most two taps —
condition, then age. Faster than asking a panicking person to describe it again.

### 4. Failure is closed, not open

- Jev call exceeds 1500ms → fallback screen
- Unrecognized category in the response → fallback (never a guess)
- Route throws → the API returns HTTP 200 with the fallback payload, not a 500
- `JEV_MOCK=1` in a production build → **the request is refused**, and the
  caller gets the fallback screen rather than keyword-matched medical routing

### 5. Ambiguity degrades toward the safer technique

Adult compression depth on an infant can cause injury; the reverse is less harmful.
When age confidence is low, `AGE_FALLBACK` picks the variant least likely to hurt if
the guess is wrong, and the screen is flagged as degraded.

## Clinical content governance

Runtime AI never authors, edits, or paraphrases medical content. Every protocol is a
static record in `lib/protocols/content.ts` with a `Provenance` entry naming its
source, edition, transcription date, and sign-off state.

**The sign-off gate:** `clinicalReview` starts at `"pending"`. It may only be moved to
`"approved"` by a qualified clinician who has read the rendered screen back against
the primary source. While any displayed protocol is pending, the UI shows a warning
banner. Any change to protocol text resets it to `"pending"`.

Current sources:

| Protocols | Source |
|---|---|
| `cpr_*` | American Heart Association — Guidelines for CPR & ECC, BLS lay rescuer sequence |
| `choking_*` | AHA / American Red Cross — first aid for foreign-body airway obstruction |
| `bleeding_severe` | American College of Surgeons Committee on Trauma — STOP THE BLEED |

## Regulatory position

An app that instructs laypeople during a medical emergency sits near medical-device
territory (FDA in the US, EU MDR in Europe). The usual safe harbour is reproducing
published public first-aid guidance **verbatim, without patient-specific
interpretation**.

That is exactly this architecture. The no-generation constraint is not only a latency
decision — it is the regulatory posture. The moment the app *tailors* advice to a
specific patient, that harbour is gone.

This has not been reviewed by counsel. Do so before shipping.

## Known gaps

- **The thresholds are unvalidated placeholders.** 0.95 / 0.75 / 0.80 were chosen
  by judgement, not measurement. TypeSafe's guidance is that thresholds must be
  evaluated on real data against the real consequences of each error class. Until
  that happens, treat every number in `THRESHOLDS` as a guess.
- **No live Jev call has been made.** All observed routing came from the mock
  keyword router. The SDK guarantees the wire contract, but nothing here has been
  exercised against the real model.
- No offline service worker yet. Protocol components are local, but a cold load
  needs network. A cached shell would let the grid work with no signal at all.
- Speech recognition is Chrome/Safari only. Firefox users get the typed input.
- The emergency number is a single build-time constant. It should be derived from
  locale — 911, 112, 999, 000 differ by country.
- No post-incident summary for EMS handoff. This is the one place a generative
  model has a legitimate role, strictly after the emergency.
