# Step 3 — What people can do, and what people need

The previous slice already put the bones in place: capabilities, service areas,
availability, what someone is open to, and Needs. This step finishes that
foundation so the distinctions the product depends on can never quietly
collapse into each other.

## What gets added

**Keeping facts separate.** A role, a skill, a qualification and experience are
stored as different things with their own details — a qualification can carry
who issued it, when it was obtained and when it runs out; experience can carry
where and for how long. None of them ever imply "available", "qualified" or
"looking for work".

**Being checked is not one badge.** Instead of "trusted person", separate
states: identity checked, qualification checked, business checked, experience
confirmed by someone, confirmed by the community — and by default, nothing
checked.

**Freshness.** Everything a person states carries when they last confirmed it
and, for availability, when it stops being true. Old statements are shown as
"may have changed" or "out of date" rather than presented as current forever.

**Where someone can help.** A separate record from where they live: areas they
serve, how far they'll travel, and — kept distinct — places they're only passing
through.

**What someone will give.** Alongside "what I'm open to", a plain list of what
someone will contribute: time, skills, labour, knowledge, tools, a vehicle,
music, translation, food, a room, mentoring. And whether they want paying,
don't, or either.

**Privacy per fact.** Each capability and each availability window can be
private, shown only locally, or public. Nothing exposes a home address.

**Needs, completed.** Needs can also require roles (not only skills), and carry
clearer payment meaning (free, fixed, from, range, donation, exchange, unpaid,
ask them, unknown) rather than a bare number.

**Both directions.** Two pure functions, no second matching engine: given a
need, who could possibly help; and given a person, what could they help with.
Both hand their evidence to the existing supply engine, which decides what kind
of possibility it is and labels it honestly — an exact match, a possible match,
a community possibility, a travelling possibility, a swap.

**Care where care is due.** A small policy layer flags regulated things
(therapy, healthcare, electrical, gas, transport, financial advice) so the app
never implies someone is allowed to do them. No legal conclusions; a note that
this needs checking.

## Screens

No new dashboard. The existing "You" page gains three calm sections in the
current visual language: what I can give, where I can help, when I'm free — plus
a "what could I help with?" view that shows a person the needs near them they
could genuinely answer. Everything stays explore-first and honest about what
isn't known.

## Test fixtures and tests

Deterministic people — Sarah (cleaner, Brighton, weekends, occasional paid),
Alex (gardener, Thursday), Maria (therapist, qualification declared and not
checked), Daniel (gardener and photographer, travelling, opted in), a community
garden, a recurring paid Bristol cleaning need, a stale profile with expired
availability, a private profile, and a skills swap pair. Tests cover creation,
service areas, availability including unknown and expired, preferences,
discovery in both directions, privacy, freshness, and the regulated-service
flag.

## Technical notes

- One migration: qualification/experience detail columns, `last_confirmed_at` /
  `expires_at` / `visibility` on capabilities and availability, service-area
  kind and travel willingness, `contribution_preferences` and
  `earning_preference`, `needs.required_roles`, `needs.payment_model`; indexes
  for label, place, visibility, freshness; owner-only write policies and
  discoverable-only public reads, as now.
- New pure modules: `capability-freshness.ts`, `policy.ts`,
  `reciprocal.ts` (person → needs), extending `supply-engine.ts` rather than
  duplicating it. Fixtures under `src/lib/fixtures/`.
- Reads go through the existing server boundary with bounded pages; no
  full-table scans, no opaque person score — signals stay named and visible in
  the debug view.
- Not in this step: the full supply engine expansion, external providers,
  messaging, moderation tooling. `hour_offers` and `listings` stay as they are
  and keep feeding the same world model; no second skills system is introduced.
