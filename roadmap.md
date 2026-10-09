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
- [x] Auth page: resend signup confirmation email option.

- [x] Vision audit first slice: trust chip on cards, home main action follows how busy the place is
- [ ] Decide product name (Real World Atlas vs The Living World) — waiting on owner
- [ ] Backend switch to the target project — waiting on owner decision (A/B/C)

## 12-hour block, 2026-10-09 (handoff)

- [x] User-facing name is "Real World Atlas" in page titles, header, locality pages and provenance label.
- [x] Home map has a Map / List switch; list shows the same loaded entries with loading, error and empty states.
- [ ] NOT VERIFIED (human, dashboard needed): private-schema exposure, RLS effectiveness, canonical backend project switch (options A/B/C).
- [ ] Next: list view on locality page; /give vs /help intent copy; screen-reader pass on entry sheet; 375px visual QA screenshots; Ticketmaster key (blocked).

## Programme plan, 2026-10-09
- [x] Service block: "Who provides this", provider-stated caveat, times labelled as stated / "Times not stated" (+ tests).
- [ ] Owner: confirm canonical GitHub repo (life-lived-network vs -2) — blocks PR/agent work.
- [ ] Owner: backend A/B/C; duplicate ADR 003 numbering; exposed-schema check (NOT VERIFIED).
- [ ] Sitemap/public-metadata leak tests (private, blocked, reported, demo, expired).
- [ ] Read-only grants/default-privileges audit, then gated remediation migration with rollback.
- [ ] Pilot research: one town, one segment, ≥20 signals, 5–10 buyer conversations (owner-led outreach).

## Sitemap privacy regression tests (done, 2026-10-09)

- `src/lib/sitemap-privacy.test.ts` calls the real public sitemap handlers and checks they list only the fixed public screens: no private screens, record ids, query strings or demonstration/blocked/reported entries.
- Finding: sitemaps never read records today, so record-level leaks are not possible right now. If locality/service/provider/event sitemaps are added, they need their own eligibility tests (visibility, moderation, demo exclusion) before release.
- Still open: page head/metadata for record detail views is not covered by these tests.

## Lint formatting cleanup (done, 2026-10-09)

- `bun run lint` before: 29 problems (21 errors, 8 warnings). All 21 errors were `prettier/prettier` formatting only.
- Ran `bunx prettier --write` on only the 9 files with those errors: data-state.tsx, draft-helper.tsx, ai/run-id.ts, draft-assist.server.ts, draft-assist.ts, earning.test.ts, earning.ts, routes/auth.tsx, routes/earn.tsx. Diff reviewed: line wrapping only; one JSX full stop moved line with identical rendered text.
- After: `bun run lint` 0 errors, 8 warnings (exit 0); `bunx tsgo --noEmit` clean; `bunx vitest run` 29 files / 230 tests passed; `bun run build` succeeded.
- Remaining: 8 `react-refresh/only-export-components` warnings (dev hot-reload only, not auto-fixable; fixing means splitting files — left for a separate decision).
