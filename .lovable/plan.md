# Possibility Supply Engine v1 — reconciliation plan

## Audit summary

The requested engine is **partly implemented already** and should be completed in place, not replaced.

### Existing foundations to preserve

- `src/lib/supply-engine.ts` is the current pure, deterministic Need → Supply engine. It already separates direct, local capability, opted-in opportunity, community, contribution, skills exchange, journey, and related bands; returns explanations and caveats; caps each band; and has a quiet result.
- `src/lib/reciprocal.ts` provides the reverse Person → Need query over the same capability/Need facts, but currently duplicates some matching rules.
- `src/lib/data/contract.ts` provides `DiscoveryContext`, bounded pagination, and opaque cursors.
- `src/lib/needs.ts`, `capability.ts`, and `capability-freshness.ts` already keep Needs, skills, roles, qualifications, experience, service areas, availability, preferences, verification, visibility, and freshness distinct.
- `src/lib/policy.ts` flags regulated categories without claiming legal permission.
- `src/lib/world-data.ts` is the normalized display entity used by listings and hour offers; `rowToEntry()` is the normalization seam.
- `src/lib/places.ts` and the `places` table provide the current locality hierarchy and approximate place coordinates.
- `src/lib/journey-engine.ts` is a pure itinerary composer, but there is no persisted JourneyContext, route, waypoint, visibility, or dated journey supply yet.
- `src/lib/needs.functions.ts` is the server boundary for bounded candidate retrieval. It prefilters by exact place and passes normalized candidates to the pure engine.
- Authentication, owner-scoped profile data, Life List, connection requests/messages, blocks, reports, and RLS already exist and remain unchanged in purpose.
- Existing fixtures are isolated from production reads and already cover direct, latent, travelling, swap, community, contribution, stale, private, and regulated cases.

### Missing or incomplete pieces

- Supply names and response shape do not yet match the reusable contract: no canonical `PossibilitySupply`, `SupplyType`, `MatchSignal`, confidence, constraints, provenance, trust summary, or supply status.
- Search order is close but not exact: local capability and opted-in latent supply are separate bands, while journey appears after skills exchange; “related” is declared but never populated.
- Direct supply does not yet enforce place, service area, time, freshness, or status consistently.
- Candidate service areas lose radius and visibility; availability loses expiry, confirmation time, visibility, timezone, and recurrence before matching.
- Earning and contribution preferences exist in the database but are not loaded into the engine, so paid/contribution intent is only approximated from broad opportunity preferences.
- Journey supply currently reuses `service_areas.relation = travelling_through`; it has no journey id, route dates, route visibility, or explicit discovery opt-in tied to a journey. It cannot truthfully enforce temporal overlap.
- Reciprocal discovery duplicates matching logic rather than invoking one shared evaluator.
- Blocking is applied to the signed-in reciprocal path, but the public Need → Supply read cannot apply viewer-specific blocks. Submitted reports do not automatically suppress a person, which is correct until a reviewed moderation decision exists.
- No Provider Registry or adapter/ingestion pipeline exists in this repository. The engine must remain provider-neutral and consume only normalized internal records; this plan does not fabricate a registry.
- No generic Possibility Graph relationship table exists. Existing foreign keys and typed domain facts already support the required relationships, so this slice will not add speculative graph storage.
- There is no spatial extension or route engine. Current matching is place-id based; radius and route calculations must be conservative and only use available place-level data.

## Implementation

### 1. Canonical supply contract

Extend the existing supply module with:

- Canonical `SupplyType`: `DIRECT`, `LATENT`, `JOURNEY`, `COMMUNITY`, `SKILLS_EXCHANGE`, `CONTRIBUTION`, `RELATED`.
- Typed `MatchSignal`: intent, skill, category, locality, service area, time, availability, journey, route, earning, contribution, community, freshness, and trust.
- `PossibilitySupply` containing the existing entity/result, explicit supply type, signals, reasons, confidence, freshness, trust, provenance, constraints, supported actions, and `ACTIVE | STALE | EXPIRED | REPORTED` status.
- A structured `SupplyQuery` built from `Need + DiscoveryContext + optional JourneyContext`; the engine will not parse arbitrary prose or call external APIs.
- Deterministic confidence derived only from declared evidence. It will be explanatory, not a hidden ranking or safety score.
- A development diagnostic record for every included or excluded candidate, with explicit reason codes.

Keep compatibility aliases/mappers for the current UI bands so existing pages continue to render while using the stronger contract.

### 2. One shared deterministic evaluator

Refactor matching into small pure evaluators shared by both directions:

- Hard gates: visibility, open/active status, expiry, reviewed-report status, blocks where viewer identity is available, required qualification presence, explicit discovery opt-in for latent/journey results, and policy restrictions.
- Evidence signals: exact intent/category/skill/role, locality versus service area, time overlap versus unknown availability, earning/contribution/exchange preference, journey route/time overlap, freshness, verification, and provenance.
- Preserve distinctions: self-declared is never verified; unknown availability is never available; passing through is never a service area; regulated work is flagged or gated according to evidence rather than silently presented as permitted.
- Progressive output order: direct exact, direct nearby, latent, journey, community/contribution, skills exchange, related.
- Populate RELATED only from normalized records with a real category/skill relationship; otherwise return the existing quiet state.

`findOpportunitiesForPerson()` will become a reciprocal projection over the shared evaluator rather than a separate rule set.

### 3. Candidate retrieval and privacy

Extend `src/lib/needs.functions.ts` without moving matching into the browser:

- Load complete visible service-area, availability, earning, contribution, freshness, and verification facts in bounded batches.
- Prefilter by indexed locality/category/skill before pure evaluation; cap every candidate collection.
- Apply viewer-specific block exclusions on authenticated queries. Public discovery remains limited to facts explicitly visible for discovery and never exposes private journey data.
- Return predictable data errors and existing lightweight observations.
- Keep provider calls out of request-time matching; any future provider must normalize into internal records first.

### 4. Minimal persisted journey context

Add the smallest reusable journey supply model because the current itinerary planner has no route/privacy data to reuse:

- `journeys`: owner, title, start/end timestamps, timezone, visibility (`private`, `friends`, `journey_network`, `public`), opportunity opt-in, status, freshness timestamps.
- `journey_places`: journey, ordered place, arrival/departure window, approximate route position.
- Owner management; public reads only for explicitly public, active, opted-in journeys. `friends` and `journey_network` remain inaccessible until those relationship systems exist rather than being treated as public.
- Journey candidate construction remains separate from live location and requires capability + opt-in + place overlap + time overlap + policy permission.
- Add indexes for owner/status/visibility/time and journey place/time lookup.

This extends the current Journey domain; it does not replace the itinerary engine or expose live routes.

### 5. Trust, provenance, and moderation state

Reuse existing verification and freshness types. Add only a small normalized provenance type for supply results, mapped from current listing quality/community origin and future adapter records.

A submitted report will **not** automatically mark someone unsafe. Add a server-only reviewed discovery status seam so only an explicit moderation decision can produce `REPORTED` and suppress discovery. Test fixtures may model reported supply without becoming production inventory.

### 6. Minimal UI integration

No redesign.

- Keep `/need/$id` grouped by the existing human-readable headings, backed by canonical supply types.
- Show concise evidence, unknown constraints, freshness, verification, and only supported actions.
- Keep `/help` as the reciprocal view using the same evaluator.
- Add a development-only diagnostic disclosure; never show raw private facts or database details.
- Preserve the existing quiet state and explicitly distinguish “no confirmed exact availability” from legitimate alternatives.

## Files

### Change

- `src/lib/supply-engine.ts`
- `src/lib/reciprocal.ts`
- `src/lib/capability.ts`
- `src/lib/data/contract.ts`
- `src/lib/needs.functions.ts`
- `src/lib/policy.ts`
- `src/lib/fixtures/supply.ts`
- `src/lib/fixtures/people-and-needs.ts`
- `src/lib/supply-engine.test.ts`
- `src/lib/reciprocal.test.ts`
- `src/routes/need.$id.tsx`
- `src/routes/help.tsx`

### Create

- `src/lib/possibility-supply.ts` — canonical contract and compatibility mapping
- `src/lib/match-signals.ts` — pure reusable signal/gate evaluation
- `src/lib/journey-context.ts` — persisted journey normalization and privacy-safe context
- `src/lib/possibility-supply.test.ts`
- `src/lib/journey-context.test.ts`
- one migration for journeys, journey places, grants, RLS, and indexes

## Database and RLS

- Create `journeys` and `journey_places` with explicit grants before RLS policies.
- Do not add foreign keys to managed auth tables; ownership is enforced through authenticated IDs and RLS, consistent with existing domain tables.
- Private journeys are owner-only. Public discovery requires `visibility = 'public'`, active/current status, and explicit opportunity opt-in.
- Do not expose friends/network journeys until those relationship models genuinely exist.
- Add GIN indexes for capability labels/Need skill arrays only where supported by the actual query shape; retain locality/time indexes.
- No changes to existing profile, listing, saved-item, connection, or Life List ownership rules.

## Deterministic acceptance fixtures

Use clearly isolated test data for:

- direct gardener in Scunthorpe;
- local self-declared gardener seeking extra paid work;
- public opted-in traveller crossing Scunthorpe on Thursday;
- private traveller that never appears;
- community garden Need;
- gardening workshop as a supported related possibility;
- no direct availability;
- stale contributor;
- reviewed-reported contributor;
- self-declared versus verified qualification;
- contribution and skills-exchange queries.

Tests will cover exact, empty-direct fallback, reciprocal skill, journey, community, contribution, privacy, freshness, trust labels, policy gates, deterministic ordering, diagnostics, action capability, and complete quietness.

## Risks and safeguards

- **Journey privacy:** default private; no exact live location; no inference from itinerary browsing.
- **False professional claims:** capability, role, qualification, verification, availability, and willingness stay separate in code and output.
- **Report abuse:** reports alone do not suppress; only reviewed moderation state does.
- **Performance:** bounded indexed retrieval first; pure in-memory evaluation second; no per-result queries or request-time provider calls.
- **Terminology migration:** compatibility mapping prevents current UI and tests from breaking while canonical types replace legacy bands.
- **No provider fiction:** because no registry currently exists, this slice creates no fake adapter or external inventory.

## Verification

- Run all deterministic unit tests and type checks.
- Run lint on changed files.
- Confirm the preview build succeeds.
- Verify `/need/$id`, `/help`, `/journey`, and `/` on desktop and mobile with no console errors.
- Run a backend security scan and inspect all new policies.

Existing authentication, RLS, profiles, map, listings, Life List, connections, visual language, and current journey composition remain intact.
