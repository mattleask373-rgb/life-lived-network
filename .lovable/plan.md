# The Living World — World-Capable Trial Architecture Plan

Audit and plan only. No product code or database state has been changed. Findings come from the current repository, live backend, and preview diagnostics. Anything not established is marked **UNKNOWN — REQUIRES VERIFICATION**.

## Executive conclusion

The permanent human-network kernel already exists: accounts, private-by-default profiles, structured capabilities, Needs, service areas, availability, deterministic Supply Engine, explicit connections, conversations, blocks/reports, Life List, real-world listings, persisted journey context, and one normalization seam into `WorldEntry`.

The blocker is not a missing second architecture. It is that the existing architecture still resolves the world through one default place and one illustrative coordinate plane. The first change must therefore be an **additive world-context and geographic-query layer around the existing `places` spine**, while Lisbon remains the first supported locality and fallback.

The live backend currently has Portugal and Lisbon only, and zero accounts, profiles, listings, Needs, capabilities, journeys, connections, blocks, or reports. The preview currently builds successfully.

## Current architecture audit

```text
people + capabilities + availability + service areas
                         ↘
Needs → bounded retrieval → existing deterministic Supply Engine → explicit connection → messages
  ↘ places / time / privacy          ↑ listings + hour offers + journey context

listings → rowToEntry() → WorldEntry → Living Map / cards / Life List / Journey arranger
```

- **Application:** TanStack Start/React, flat routes, React Query, server functions for shared reads and authenticated domain actions, plus some RLS-protected browser writes.
- **Geography:** one `places` table with self-parenting kinds: country, region, area, city, town, village, neighbourhood. It stores slug, country code, timezone, currency and approximate centroid.
- **Human world:** one profile model plus separate capability, service-area, availability, preference and contribution tables. Needs remain first-class and distinct from listings.
- **Discovery:** `DiscoveryContext` already carries place, approximate coordinates/radius, time, entity types, cursor and mode. Most geographic/time fields are not yet applied by retrieval.
- **Matching:** `supply-engine.ts` is the single deterministic Need→possibility evaluator. Reciprocal discovery exists separately and shares some, but not all, semantics.
- **Connections:** request snapshots, status transitions and messages are participant-only; backend policies prevent blocked pairs from interacting.
- **Journeys:** `journeys` and `journey_places` persist privacy-safe, opt-in context. `journey-context.ts` checks place/time overlap. The visible Journey page instead uses the separate pure itinerary arranger; persisted journey context has no UI yet.
- **Media:** optional source-attributed listing photos are normalized and shown, capped at six. There is no upload flow. Profile photos can render but cannot be set in the product.
- **Providers:** no provider registry, external ingestion, external listing API, map SDK, cache or deduplication store exists. Future-provider comments and provenance types are seams, not an implemented provider system.
- **Graph:** relationships exist relationally through foreign keys and domain tables; there is no generic graph store. None is needed for this phase.

## Every Lisbon / single-locality assumption found

1. `DEFAULT_PLACE_SLUG` and loading fallback are Lisbon/Portugal.
2. The home title/description and Journey copy name Lisbon directly.
3. Only Portugal and Lisbon are seeded and live.
4. `/make` contains a fixed list of Lisbon neighbourhood names and hand-selected 0–100 positions.
5. `/need` and `/make` silently use the default place; neither asks for world context.
6. `/give` uses a Graça example; fixtures use Lisbon districts and stories.
7. The Living Map is a fixed illustrated Lisbon-like SVG; pins use unrelated percentage `x/y`, not latitude/longitude.
8. World and Supply retrieval use exact `place_id`; they do not traverse ancestors/descendants, use radius, or apply viewport bounds.
9. `fetchPlaceBySlug` resolves only one parent; `fetchPlaces` stops at 500 rows with no paging/search.
10. `placeLabel` falls back to “Lisbon” when resolution is absent, which can mislabel another locality after a failed lookup.
11. Free-text `place`, `place_text`, `location`, and `neighbourhood` coexist with canonical `place_id`; neighbourhood text is not connected to the hierarchy.
12. Euros and English time strings remain hard-coded in Journey and money presentation despite place currency/timezone fields.
13. Home reads one place; Journey and Life List read unscoped world data.
14. Fixtures are correctly disabled in production by policy, but development visibly mixes Lisbon fixtures into page one.

## Existing geography structure

**Keep:** `places.id`, `parent_id`, kind, canonical labels, country code, timezone, currency, centroid, public-read/service-write policy, and existing foreign keys from profiles/listings/hours/Needs/journey stops.

**Gaps:** globally unique slug cannot represent repeated locality names safely; there is no canonical path, ancestry query, boundary/bounding box, spatial index, coordinate validation, search/pagination, alias handling, or hierarchy-aware locality resolution. Coordinates are nullable plain numeric values. PostGIS availability is **UNKNOWN — REQUIRES VERIFICATION** before selecting the spatial implementation.

## Existing map structure

`LivingMap` is a clean component boundary but its renderer is a fixed SVG with 0–100 pins. It has no projection, pan/zoom, viewport, clustering, geographic bounds or provider. Keep its public interaction contract and visual language; replace the coordinate implementation inside that boundary, not by adding a second map feature.

## Existing journey structure

- The itinerary arranger is pure and only arranges supplied real/fixture entries; it invents nothing.
- Persisted journey context is separate, private by default, and public only after explicit visibility + opportunity opt-in + active status.
- Overlap currently requires exact stop `place_id` and known temporal overlap where times exist.
- The Journey page is not connected to persisted journey CRUD, origin/destination, hierarchy, route corridors or world context.
- Legacy `travellingThroughPlaceIds` can produce a journey candidate without the full persisted-journey consent checks; this must be retired from discovery, not expanded.

## Existing entity / discovery structure

- `listings` is the canonical internal real-world listing store; `rowToEntry()` is the protected normalization seam and `WorldEntry` is the stable presentation contract.
- Needs, people/capabilities, hour offers and journey context remain deliberately distinct domain entities.
- The Supply Engine already exposes direct, latent, journey, community, skills exchange, contribution and related bands with evidence, caveats, trust/freshness and diagnostics.
- Retrieval is bounded, but world paging is offset-based; Supply candidate reads use fixed caps (people 200, listings/hours 150) and repeated in-memory joins. Truncation is not diagnosed.
- `DiscoveryContext` promises radius/time/entity filtering that current queries do not honour. Related-entry proximity still uses illustrative `x/y`.

## Exact changes required for global scale

| Existing | Change | Reason | Risk | Test |
|---|---|---|---|---|
| `places` hierarchy with global unique slug | Add canonical path/parent-scoped identity, hierarchy traversal, coordinate checks and bounded place search; preserve IDs and Lisbon rows | Repeated names and deep locality trees must resolve safely | Broken old Lisbon links or ambiguous paths | Migration compatibility; duplicate-name fixtures; ancestor/descendant and Lisbon regression tests |
| One default Lisbon context | Add one URL/session-driven `WorldContext` resolved from `places`; `/` keeps Lisbon as pilot fallback, never as failed-fetch label | Every screen must agree which world is being viewed | Context drift between map/forms/lists | Change locality and verify map, create flows, currency, timezone and queries all follow it |
| Exact `place_id` filters | Extend existing server reads to accept descendant place IDs and bounded viewport/radius; apply time/entity filters already present in `DiscoveryContext` | City, neighbourhood and nearby discovery must work across boundaries | Privacy leakage or expensive scans | RLS tests; city→neighbourhood inclusion; radius edge cases; query-plan/index checks |
| Plain lat/lng, no spatial index | Verify spatial support; then add one indexed geographic representation or a bounded lat/lng fallback, using only public approximate/entity coordinates | World map and nearby search need indexed bounds | Extension portability and accidentally precise coordinates | Coordinate range checks; viewport correctness; no private point returned |
| Static SVG `LivingMap` | Evolve the same component into a real geographic renderer with `center`, `bounds`, zoom and bounds-change callback; retain illustrated Lisbon fallback until parity | One map must support local and world scales | Provider cost, blank maps, visual regression | Desktop/mobile rendering, pan/zoom, clustering, empty/error fallback, Lisbon parity |
| `WorldEntry` x/y only | Add optional lat/lng, currency, timezone, structured time and provenance fields while retaining x/y during migration | Existing cards survive while geographic screens become real | Two coordinate systems linger too long | Mapper tests for legacy and geographic rows; remove x/y use only after parity |
| Offset pages and fixed candidate caps | Move to stable keyset/viewport cursors, grouped joins, explicit truncation diagnostics and composite/spatial indexes | Predictable performance beyond one city | Changed ordering and missed boundary rows | Pagination no-duplicate/no-gap tests; load/query-plan tests; diagnostic assertions |
| Separate Journey UI and persisted context | Connect the existing page to existing journey functions; resolve stops through hierarchy and route/time context; remove legacy ungated travel matching | Journeys become useful without implying live location/work availability | Consent regression | Private/friends/public/opt-in matrix; overlap, expiry and hierarchy tests |
| Partial authenticated block filtering | Use authenticated reads for signed-in personalized discovery and consistently exclude blocks before matching; retain RLS enforcement on requests/messages | Blocked people must not reappear as suggestions | Public browsing cannot know viewer blocks | Two-account tests across browse, match, invite, thread and unblock |
| Source-photo schema with no product upload | Add controlled profile photo upload first; keep listing photos source-attributed and add creator upload only with consent/credit rules | Real people need authentic presence for a trial | PII, unsafe media, orphan files | File/type/size checks, owner access, deletion, neutral fallback and six-photo cap |
| Console-only data observations | Add privacy-safe operation metrics for query duration, counts, truncation and failures; never log free text or journey detail | Pilot issues need diagnosis | Sensitive logging | Redaction tests and forced-failure diagnostics |
| Static route metadata | Add real-data locality routes and unique complete metadata only for supported places; noindex private/personal pages | Shareable local discovery without fabricated SEO | Thin/empty pages | SSR metadata tests; zero-data places not indexed; canonical-path tests |

## Database changes required

1. Add canonical place path/parent-scoped uniqueness and ancestry support without replacing `places`.
2. Add coordinate range constraints; verify PostGIS, then choose a GiST point index or documented bounded numeric fallback.
3. Add composite discovery indexes aligned to real predicates, including published/open status + place + freshness/time + stable cursor keys.
4. Add/repair user foreign keys with cascade on `needs.creator_id`, `person_capabilities.user_id`, `service_areas.user_id`, `availability_windows.user_id`, and `opportunity_preferences.user_id`; live constraints confirm these are currently missing while later tables have them.
5. Add no new universal entity, profile, journey, matching or provider tables in the first slices. Add storage policy/migration only when the photo slice is approved.
6. Do not seed a fake world. Add only verified pilot place hierarchy rows needed for the controlled trial.

## RLS / privacy changes required

- Preserve current owner policies, discoverability default false, per-fact visibility, approximate-location language, journey opt-in and participant-only conversations.
- Apply mutual-block exclusion to authenticated browsing and both matching directions; backend connection/message policies already enforce blocks.
- Keep public geography readable but service-managed.
- Return place centroids/approved approximate entity points only; never store or expose home, live, or journey-tracking coordinates.
- Add a genuine review path before treating reports as operational moderation. Current reporting records submissions but has no reviewer UI/role workflow.
- **UNKNOWN — REQUIRES VERIFICATION:** retention policy, terms/consent copy, emergency escalation procedure, pilot moderator ownership, and legal review by launch jurisdiction.

## Performance / indexing changes required

- Hierarchy-aware place lookup, spatial/bounds index, stable keyset cursors, map clustering and a hard viewport result ceiling.
- Group candidate rows by user once instead of repeated filters; report total considered/truncated.
- Apply `DiscoveryContext` filters in the database before the Supply Engine, while keeping ranking pure and deterministic.
- Add short server caching only for public place metadata and public viewport results; never cache personalized/private matches across users.
- Keep progressive disclosure: locality first, viewport second, details on selection; never load the world.

## UI changes required

- A quiet world/locality selector and clear current-place label shared by map, Need, listing, hour and Journey flows.
- Real geographic map behavior inside `LivingMap`, with list fallback, clustered pins, restrained density and no live-person markers.
- Place selection instead of Lisbon defaults in creation forms; display timezone/currency from context.
- Persisted journey editing with explicit visibility and opportunity opt-in wording.
- Authentic user-supplied photos only; keep neutral placeholders and mature Lucide iconography.
- Preserve current design tokens, cards/sheets, language, explore-first flow and the principle that a successful session ends off-screen.

## Real-world trial readiness gaps

- No real accounts or content exist in the live backend, so no live end-to-end human loop has occurred.
- No controlled invite/onboarding sequence or pilot place dataset.
- No two-account browser test of capability → Need → match → connection → reply → block/report.
- Blocks are not consistently filtered from discovery before results are shown.
- Reports have no moderation/reviewer workflow.
- Profile/listing photo upload is absent.
- Persisted journeys have no UI.
- No geographic world map, place search, viewport query or clustering.
- Some critical creation paths still write directly from the browser; RLS protects them, but server-boundary validation/observability is inconsistent.
- Policy flags are English keyword heuristics, not jurisdiction-aware legal decisions.
- No notifications; for a small facilitated pilot this can be manual and deferred.

## What remains unchanged

Accounts/authentication; the single profile model; existing RLS posture; `places`; listings and `rowToEntry()`; Needs; capability facts; service areas; availability; the Supply Engine; connection snapshots and status model; conversations; Life List; journey tables and pure Journey arranger; `WorldEntry` compatibility; fixtures restricted to development/tests; honest freshness/trust labels; source-attributed photography rules; design system and navigation language.

## What is deferred

External provider ingestion/registry, scraping, generic graph infrastructure, AI guide/ranking, payments, ratings/reviews, realtime chat indicators, push/email automation, route optimization, global place import, full multilingual policy engine, public SEO pages for empty localities, and opening multiple cities at once.

## Phased implementation plan

### Phase 0 — Pilot safety closure
Close block filtering across authenticated discovery/matching, make report writes explicit, add moderator-operating requirements, and build two-account end-to-end tests. No visual redesign.

### Phase 1 — World context and geography
Extend the existing `places` model with canonical paths, hierarchy traversal, bounded search and indexed geographic queries. Add one shared World Context; keep Lisbon as the first supported fallback and verify all existing Lisbon flows.

### Phase 2 — One real map
Upgrade `LivingMap` behind its existing boundary to consume geographic entries and emit viewport changes. Add clustering, bounded retrieval and graceful fallback. Selecting the map provider/connection occurs at implementation time after cost/domain constraints are confirmed.

### Phase 3 — Global-aware human loop
Make profile, capability/service-area, Need, listing and hour creation use the shared world context. Apply hierarchy/radius/time filters before the unchanged deterministic Supply Engine. Add keyset paging and diagnostics.

### Phase 4 — Living journeys
Expose existing journey persistence, stop selection, dates, visibility and opt-in. Feed hierarchy-aware stop/time context into Supply; remove legacy travel inference.

### Phase 5 — Controlled real-world trial
Seed only verified pilot geography; invite a small cohort; add authentic profile photos; exercise the complete two-person flow; establish report review and support procedures; monitor quiet states, match reasons, failures and response times without vanity metrics.

### Phase 6 — Locality publishing
Add canonical locality URLs and complete metadata for places with sufficient real content. Keep empty or fixture-only localities unindexed.

### Phase 7 — External world, later
Only after the human loop works, introduce provider → adapter → normalization → deduplication → provenance/freshness/policy → existing internal entities. No request-time external dependency and no fabricated records.

## Approval boundary

Approve **Phase 0 and Phase 1 only** as the next implementation slice. They make the system safe for trial and world-context capable without replacing the map, entities, journeys, matching, design or Lisbon experience. Phase 2 should receive its own short audit/plan because it introduces a usage-metered map provider and visible interaction changes.
