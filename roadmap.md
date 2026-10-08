# Roadmap

## Final product hardening (done)

- [x] Restore separate map exploration and explicit area adoption.
- [x] Harden account restoration, async error states, detail-sheet accessibility and locality presentation.
- [x] Make Road Trip stop restoration resilient and storage-safe.
- [x] Clear test, typecheck, lint, build, security and desktop/mobile release gates.
- [x] Remove `.env` from repository tracking; `.env.example` documents the required local configuration.
- [x] Replace blank account loading with visible loading and recoverable read/session errors.
- [x] Prevent failed world reads from appearing as honest empty-locality states.
- [x] Keep locality-aware money/date formatting and provenance visible in saved Road Trip stops.

## Done

- UK & Ireland geography, locality picker, descendant discovery (Slice 1)
- Human possibility, connection requests, safety, moderation review (Slice 2)
- Event pipeline: source registry, adapter, normalise, dedupe, provenance, freshness (Slice 3A)
- Kings Heath first locality: development fixture feed (no network), service and
  practice representation with truthful booking states, service answers on a
  need, reviewer source health

## Open (blocked)

- Live Birmingham events: waiting on a Ticketmaster API key. The source stays
  switched off and says "Live source not configured" until one is supplied.
- Genuine Guildhall details (hours, practices, practitioners, booking pathway):
  waiting on the organisation. Until then those records are labelled
  demonstrations and nothing is bookable.

## UK-wide scale fabric (done)

- 221 localities across UK nations, counties/council areas, cities, towns, neighbourhoods; Ireland separate; Portugal/Lisbon preserved and non-default.
- Hierarchy expanded behind the server boundary, so a nation-wide choice no longer sends thousands of localities over the wire.
- Broad selections never silently filter by a partial slice; reads stay bounded and paged.
- Quiet places say so, and offer stepping out to a wider area.
- Locality picker shows how many more places sit inside one.
- Geography tests: src/lib/places.uk.test.ts (147 tests total).

### Still honestly missing

- Ticketmaster live events: waiting on TICKETMASTER_API_KEY.
- The Guildhall's real hours, practitioners and booking pathway: not supplied.

## Kings Heath hub (done)

- Locality reads as one thing: five honest questions with true counts (including noughts).
- What's happening (dated things by day), What's here (providers grouped with their services and booking truth), Who's here and what's needed (offered hours + open needs count).
- Open needs are now read across a locality's descendants, server-side.
- Reusable for any locality; no place-specific logic. Tests: src/lib/locality.test.ts.

Blockers unchanged: Ticketmaster key absent; genuine Guildhall details not supplied.

## Map exploration + road trips (Slices 1 and 2 of the map/journey plan — done)

- The map now has a real viewport: zoom, drag, pinch-friendly, scale label,
  "back to where you are", and grid clustering so a wide view says how much is
  somewhere instead of stacking pins. `src/lib/map-view.ts` is pure and tested.
- Viewport and locality are kept apart: moving the map never moves the person.
  When the view settles over a known place, the map offers "Make this my area".
- `/road-trip`: choose origin, destination, travel mode, date and interests; corridor localities are worked out from the place index and answered by the existing bounded world read. Grouped as before you set off / along your route / a small detour / where you are heading, each card showing only reasons it can prove. Tests: `src/lib/road-trip.test.ts`.
- Routing is honest: no provider is connected, so straight-line distance is shown
  and detour times are labelled unavailable rather than estimated.
- Road-trip discoveries now show every supported interest match, event timing,
  provenance and meaningful freshness without inventing evidence.
- A device-persisted journey builder adds canonical entry stops without duplicates,
  shows origin/stops/destination, supports move/remove, and recalculates without
  pretending to optimise a driving route.

### Open (blocked, needs a decision or credentials)

- Route provider (real distance, duration, polyline, detours): needs a chosen
  provider and key. Slice 3 of the plan.
- Public transport provider and journey legs: Slice 6, needs a key.
- Car sharing from people's explicitly shared journeys: Slice 7, not started.

## SEO slice 1 — technical foundation (done)

- `src/lib/seo.ts`: one place decides what a page tells a search engine. Canonical
  address (tracking parameters and fragments stripped), public vs private
  metadata, sitemap XML builders. Tested in `src/lib/seo.test.ts`.
- Every page now uses it: the six public screens are indexable with a canonical
  URL; auth, profile, conversations, needs, help, moderation and sources say
  noindex, nofollow.
- `robots.txt` disallows the private screens and names the sitemap.
- `/api/public/sitemap.xml` (index) and `/api/public/sitemap-pages.xml`, ready for
  locality, service, provider and event sitemaps to join without churn.
- Site address comes from `VITE_SITE_ORIGIN` when set, otherwise the published
  Lovable address — set it when a custom domain is connected.

### Next SEO slices (not started)

2 service taxonomy + locality landing pages · 3 service + locality pages with the
indexability gate · 4 provider profiles · 5 structured data + full sitemaps ·
6 enquiry pathway · 7 cross-navigation, analytics, commercial foundation.

## SEO slice 2 — service kinds + locality pages (done)

- `src/lib/service-taxonomy.ts`: one shared list of service kinds (osteopathy,
  sports massage, gardening, tutoring, venue hire and so on) in seven groups.
  A listing joins a kind either because its owner declared it (new optional
  `service_category` on listings) or because the words the listing itself uses
  match — and the page always shows which. The most precise reading wins
  ("wedding photography" over "photographer"). Nothing is inferred about a
  provider and no qualification is ever implied. Tested.
- Public locality pages at `/<country code>/<place>` — e.g. `/gb/kings-heath`,
  `/gb/birmingham`, `/ie/dublin`, `/pt/lisbon`. One generic route for any place
  at any depth; no city-specific code. Any other country segment redirects to the
  one canonical address.
- Each page is server-rendered so it can actually be read by a crawler: what's
  happening, what's here by provider, kinds of service recorded, hours people
  offered, places inside and nearby, breadcrumbs, and a way into the map.
- Honest interim indexability rule: a locality page is only offered to search
  engines once it holds at least three real (non-trial) records. Otherwise it is
  noindex but still works for anyone who arrives. Slice 3 replaces this with the
  full explainable gate.

### Still ahead

3 service + locality pages and the indexability gate · 4 provider profiles ·
5 structured data + locality/service sitemaps · 6 enquiry pathway ·
7 cross-navigation, analytics, commercial foundation.

## Pre-meeting hardening (done)

- Navigation reduced to three doors (Explore / Find / Journey) with secondary links.
- Home locality links to its own public page.
- Currency now follows the locality everywhere (no leftover euro labels).
- Dated demonstration activity added for Kings Heath and Digbeth so "what's happening" is demonstrable.
- Event dates formatted deterministically (no hydration mismatch).
- Blockers unchanged: no Ticketmaster key; no genuine Guildhall details; no route/transport provider.

## Income (stage 1 done)

- [x] `/earn`: paid asks from the canonical opportunity read, pay shown only as stated (integer cents), skill gaps counted from real asks.
- [ ] Training providers, business exploration, community/housing pathways — need verified sources and a scope decision.
