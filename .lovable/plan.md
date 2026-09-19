# Map, Journeys and Road Trips — audit and plan

No code was changed. This is an audit of what exists plus the smallest safe route to
an interactive map and a road-trip planner that reuses the Living World as it stands.

## A. What exists today

**Production-ready and reusable as-is**

- Geography: one generic `places` table (221 UK/Ireland/Portugal localities), hierarchy
  helpers (ancestors, descendants, within, search), approximate coordinates, timezone and
  currency per place. No place-specific code anywhere.
- Locality context: persisted current locality, place picker, server-side hierarchy
  expansion, bounded reads, honest quiet states.
- Canonical entities: one `WorldEntry` model covering events, services and offers, with
  provenance, source name, freshness, cancellation, booking truth and approximate
  coordinates. Services group under their provider.
- People, capabilities, needs, possibilities: deterministic supply engine with explainable
  labels, privacy/qualification/time/service-area/block rules, reciprocal matching.
- Connections: expression of interest, immutable need snapshot, participant-only messages.
- Ingest pipeline: source registry, adapters (Ticketmaster, development fixtures),
  normalisation, dedupe, provenance, freshness, source health, reviewer-only refresh.
- Moderation: reviewer roles, report review, RLS throughout.

**Partially implemented**

- Journey engine (`journey-engine.ts`): arranges existing entries into day-shaped plans from
  a brief (days, budget, interests). No origin, destination, route or geography.
- Journey context (`journey-context.ts`): persisted journeys with ordered stops, arrival and
  departure times, visibility, opportunity opt-in, freshness. Used only for people matching.
- Map (`living-map.tsx`): hand-drawn SVG, coordinates projected to a fitted bounding box.
  Fixed viewport — no zoom, no pan, no clustering, one marker per entry.

**Missing entirely**

Routes and corridors, detours, transport modes, route or transport providers, viewport-based
loading, car-share evidence, journey sharing, journey/road-trip pages, journey SEO routes.

## B. Map gap analysis

The map needs, in order: a viewport (centre plus span) held in component state; wheel,
pinch and drag handlers that change the viewport only; projection driven by the viewport
rather than by the entries; clustering by grid cell once a cell holds more than a few
entries; and a "back to Kings Heath" control.

Two separate pieces of state, never conflated:

```text
MAP VIEWPORT          what you are looking at   (transient, not persisted)
DISCOVERY LOCALITY    where you are            (persisted, changes only on request)
```

Panning never changes the locality. When the viewport settles over a known place the map
offers "Explore this area" (fetch that place without adopting it) and "Make this my area"
(adopt it). Entries load for the viewport through the existing bounded server read, with a
new bounding-box filter and a hard candidate cap.

## C. Journey architecture

Keep both existing pieces and put a route lens over them:

```text
ORIGIN + DESTINATION + DATE + MODE
      ↓  RouteProvider
ROUTE (polyline, distance, duration)
      ↓  corridor bounding
PLACES touched by the corridor
      ↓  existing bounded discovery (unchanged)
CANDIDATE ENTRIES
      ↓  evidence + detour
DISCOVERIES  →  ADD TO JOURNEY  →  journey_contexts stop
```

The existing possibility engine stays the only source of truth for people, capabilities
and needs. The road trip adds geography and time, not a second discovery engine.

## D. Route provider strategy

Abstraction first: `RouteProvider` with `route(origin, destination, mode, departAt)` and
`detour(route, point)`, returning distance, duration, a coarse polyline and provenance, or
a clear "unavailable". Candidates to evaluate on licence and cost before committing:
OpenRouteService, Mapbox Directions, Google Routes (already connectable here), Valhalla
self-hosted, OSRM. Shared OSM infrastructure is not treated as a production backend.
Until a provider is connected, the planner runs in corridor-only mode: straight-line
corridor between origin and destination, and detours reported as unavailable rather than
estimated. Tiles follow the same rule — the hand-drawn map keeps working with no provider.

## E. Public transport strategy

`TransportProvider` with journey planning, legs, operators and disruptions where supplied.
Candidates: TransportAPI (UK multimodal), TfL (London), Traveline/BODS feeds, Transport for
Ireland. Normalised to journey legs; the interface never names a provider. Live status is
only ever shown when the provider genuinely supplies it.

## F. Car-sharing strategy

No network is built. A lift exists only when a person's own journey says so: public journey
visibility, car-share opt-in, active status, compatible corridor and timing, no block, and
the user chooses to make contact. Reuses `journey_contexts` plus the existing connection
flow. No live location, no exact home, no automatic contact.

## G. Road trip architecture

Origin and destination resolve through the existing place index (a region such as
"Scotland" is a valid destination — its centroid and descendants). The corridor becomes a
set of place ids whose approximate coordinates fall within a width of the route; discovery
then runs through the existing world read with date filtering. Each result carries only
evidence it can prove: distance from route, detour when a provider supplied one, date match,
provenance, freshness, stated interest match.

## H. Hidden gems without opaque ranking

No score is shown and none is invented. A candidate appears with its reasons, ordered by
route position then detour distance — deterministic, and the same twice. Labels map to
stored facts only: "Along your route", "Small detour", "On your travel date",
"At your destination", "Matches your saved interest", "Listed by <source>",
"Approximate detour information unavailable".

## I. UI and UX

- Map: zoom controls, drag, scale hint, cluster bubbles, "Explore this area" /
  "Make this my area", return-to-locality.
- `/road-trip`: From, To, When, How, optional interests → Plan journey.
- Results: route summary (distance, duration, provenance, timestamp), route map,
  "Discover along the way" cards grouped as On route / Small detour / At destination,
  each card opening the existing entry sheet, plus Add to journey and Recalculate.

## J. Provider and credential requirements

Nothing is invented and nothing is asked for inside the app. Needed before the relevant
slices: a routing provider key, optionally a map tile provider, a UK public-transport key,
and the still-absent Ticketmaster key for live events. Each needs licence, attribution,
caching and rate-limit terms checked first. All calls stay server-side.

## K. Database changes

Only what each slice needs: `journeys` gains origin/destination place, mode, depart date,
cached route summary and provenance; `journey_stops` gains entity reference, position and
detour facts; `route_cache` keyed by origin/destination/mode/date with an expiry; the source
registry gains provider categories (route, transport, map, place, car share). Places already
carry coordinates; a bounding-box index is added for viewport reads.

## L. RLS and privacy

Journeys stay owner-only unless explicitly public. Route cache is server-only. Car-share
discovery requires opt-in. No exact coordinates for people, no future travel dates exposed
by default, no journey history shared. Existing policies stay untouched.

## M. Performance

Viewport reads bounded by box plus a candidate cap; clustering server-side above a zoom
threshold; one route request per plan, cached; corridor candidates capped and deterministic;
provider failure degrades to corridor-only rather than erroring; no per-candidate external
calls.

## N. Test plan

Pure-function tests for viewport projection and clustering, corridor bounding, detour
arithmetic and the unavailable case, candidate ordering and evidence labels, mode handling,
date and freshness filtering, cancelled and stale exclusion, and geography cases (London →
Scotland, Birmingham → Cornwall, Bristol → Manchester, Cardiff → London, Belfast → Dublin,
rural and city routes). Provider adapter tests for valid, malformed, timeout, auth failure,
rate limit, empty and duplicate responses. Privacy tests for private journeys, car-share
opt-in, blocked users. Full regression over people, needs, possibilities, connections,
moderation, Life List, events, services, locality discovery, provenance and freshness.

## O. Implementation slices

1. **Interactive map** — viewport state, zoom, pan, clustering, viewport reads, explore vs
   adopt an area. No providers, no journey work.
2. **Road-trip foundation** — `/road-trip` page, origin/destination/date/mode, corridor-only
   discovery from existing data, honest "routing unavailable", journey persistence.
3. **Route provider** — `RouteProvider` abstraction, one adapter behind a key, real distance,
   duration, polyline, detour, caching, graceful failure.
4. **Route-aware discovery depth** — interests, event timing, freshness and provenance
   evidence on every card; destination and near-route grouping.
5. **Stops and detours** — Add to journey, sequence, recalculate.
6. **Public transport** — `TransportProvider`, legs, one adapter.
7. **Car sharing** — explicit journey compatibility into the existing connection flow.

Slices 1 and 2 need no credentials and can start immediately; 3 and 6 wait on provider keys.

CURRENT ARCHITECTURE AUDITED.
MAP + JOURNEY + ROAD-TRIP EXPANSION PLAN READY.
PROVIDER REQUIREMENTS IDENTIFIED.
IMPLEMENTATION SLICES DEFINED.
NO IMPLEMENTATION PERFORMED.
