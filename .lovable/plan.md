# Stage 2 — next architectural slice

Stage 1 (geography spine) is already in: places hierarchy with real coordinates,
timezone and currency; listings/profiles/hour offers attached to a place; the
journey engine no longer hard-wired to demo data.

This slice does the next two foundations only — the server data boundary, and
Needs + Capabilities with one unified supply engine behind them. No new look,
no external providers yet, no AI.

## 1. Server data boundary

Today the browser talks to the database directly for everything. Move reads
behind server functions so paging, indexes and future caching have one home.

- `src/lib/world.functions.ts` — public reads (published listings + open hour
  offers for a place, paginated, place-filtered). Public: no login needed,
  keeps explore-first.
- `src/lib/needs.functions.ts`, `src/lib/capability.functions.ts` — owner-scoped
  reads/writes behind the existing auth middleware.
- Home, journey, three-hours and give keep the same components; only their data
  source changes. `WorldEntry` and `rowToEntry()` stay the boundary.

## 2. Needs become real

A structured `needs` table: category, free description, place + approximate
coordinates, real start/end timestamps with timezone, flexibility, budget and
payment type, required skills/qualifications, recurring, urgency, contact
preference, visibility, status, expiry.

This one shape covers paid work, help, community projects, volunteering and
skills exchange — no per-use-case systems.

## 3. Capabilities become real, and stay honest

Separate tables so nothing is ever implied:

- `person_capabilities` — kind (role / skill / qualification / experience),
  label, level, evidence, verification state.
- `service_areas` — which places a person will actually travel to, place-level.
- `availability` — explicit windows, not inferred.
- `opportunity_preferences` — paid, one-off, recurring, exchange, community,
  volunteering, travelling.

Having a skill never means available, qualified, professional or willing. Each
is its own stored fact.

## 4. One supply engine

`src/lib/supply-engine.ts` answers "who or what could meet this need?" and
returns results in labelled bands, never one blended score:

```text
DIRECT → LOCAL CAPABILITY → OPEN TO OPPORTUNITIES → COMMUNITY
→ CONTRIBUTION → SKILLS EXCHANGE → JOURNEY → RELATED
```

Each result carries why it matched, what it actually is, how fresh it is, and
what the user can do next. When nothing real matches, it says so — a quiet
state, never a fabricated suggestion.

Deterministic, pure, takes its data as arguments, tested with fixtures
(gardener direct / latent / travelling, community garden, cleaner, no match).

## 5. Small honest surfaces

- `/need` — post what you need, in the same warm style as `/make`.
- `/need/$id` — the possibilities found, in bands, plainly labelled.
- Profile gains capability, service area, availability and preference sections.

## Technical notes

- New tables get GRANTs, RLS, owner-scoped policies, narrow public read only
  where a need is explicitly public, and indexes on place, time, status,
  visibility and updated_at.
- Existing `listings` and `hour_offers` are not replaced in this slice; the
  supply engine reads both so they stop drifting apart.
- Vitest added for the engine and fixtures.

## Not in this slice

Provider registry and external events/jobs, routing fabric, journeys as
records, SEO locality pages, admin plane, AI. Each is its own later slice on
top of this.
