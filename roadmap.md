# Roadmap

## 2026-10-19/20 — Overwrite reconciliation + service pages (SEO slice 3, frontend half)

- Repository overwrite incident (19 Oct, 21:37) reconciled read-only: current main is a superset of the backup branch `lovable-backup-main-1792442270`. The backup's only unique content is two historical plan docs and the tracked `.env` that PR #157 deliberately removed — no implementation work is stranded. Backup left untouched; do not restore `.env` from it.
- PRs #157 (.env hygiene), #163 (service-area-only matching), #170 (configurable default locality), #129 (private routes out of crawler paths) are now merged on main.
- New public route `/<country>/<place>/<service>` (e.g. `/gb/kings-heath/gardening`): canonical country-segment redirect, 404 for unknown place or service slug, breadcrumbs, genuine listings via the shared service taxonomy (record's own evidence only), honest quiet state with offer/browse-wider steps, related services, child-place links. Demonstration records are disclosed, never counted as supply.
- Indexability: a service page is offered to search engines only with ≥1 genuine current listing (`servicePageIndexable`); quiet pages emit `noindex, nofollow` (verified in served HTML). This reuses the publicPage/privatePage convention — the full explainable INDEXABLE/NOINDEX gate remains a backend dependency; `src/lib/service-page.ts` is the single seam to re-point.
- Route structure fix: `$country.$place.tsx` is now a bare `<Outlet />` layout; the locality page moved to `$country.$place.index.tsx`; `localityPath` moved to `src/lib/locality-path.ts` (route files exporting helpers break fast refresh).
- Locality page "kinds of service" chips now link to the new service pages.
- Files: `src/lib/service-page.ts` (+test, 11 tests), `src/lib/locality-path.ts`, `src/routes/$country.$place.tsx`, `src/routes/$country.$place.index.tsx`, `src/routes/$country.$place.$service.tsx`.
- Checks: tsgo clean; lint 0 errors / 7 warnings (existing); vitest 41 files / 320 passed; build OK. Playwright 375px: service page (quiet + trial-data disclosure), locality page, unknown-service 404, wrong-country redirect all verified; no console/page errors.
- Still ahead (backend/Codex dependencies): canonical indexability gate, service/locality sitemaps, structured data, enquiry endpoint, Australian place records (none exist — do not seed).
- Enquiry pathway (Workstream E, frontend half): fixed a truthfulness bug — the "Ask about this" step claimed "your message goes to the provider", but no provider-messaging pathway exists. The note now says so plainly and offers the real step (post a need, visible to people in the place). The step now carries the service's title into `/need` as an editable pre-fill (validated `q`/`from` params), so the visitor lands with context instead of an empty form. Live click-through is untestable with trial data by design — demonstration records never show an enquiry step; covered by unit tests instead. Files: `src/lib/services.ts`, `src/components/entry-sheet.tsx`.
- QA: service page verified at 1280px and 375px; quiet-state CTAs measure 66px tall; no console/page errors.

## Final product hardening (done)

- [x] Restore separate map exploration and explicit area adoption.
- [x] Harden account restoration, async error states, detail-sheet accessibility and locality presentation.
- [x] Make Road Trip stop restoration resilient and storage-safe.
- [x] Clear test, typecheck, lint, build, security and desktop/mobile release gates.
- [ ] Remove `.env` from repository tracking; it is ignored now, but repository-index changes are platform-managed.
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
- The Guildhall's real hours, practitioners and booking pathway: waiting on the organisation.

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
- `/road-trip`: choose origin, destination, travel mode, date and interests;
  corridor localities are worked out from the place index and answered by the
  existing bounded world read. Grouped as before you set off / along your route /
  a small detour / where you are heading, each card showing only reasons it can
  prove. Tests: `src/lib/road-trip.test.ts`.
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

## 2026-10-11 push
- [x] Place pages show their own "couldn't load" (with retry) and "place not on record" screens instead of a blank/generic page.
- [x] README: Bun commands and environment variable names (no values).
- [x] App-wide boundaries: inspected — the top-level page already catches errors and missing pages for every page, so router defaults would be redundant. Instead restyled both screens to the site look (paper background, 44px focus-visible buttons, error announced to screen readers, "Back to the map").
- [x] README secrets list corrected: LOVABLE_API_KEY (provided by Lovable), TICKETMASTER_API_KEY (optional, added by owner) — names only.
- Checks 2026-10-11: `bunx tsgo --noEmit` clean; `bun run lint` 0 errors / 8 warnings (existing); `bunx vitest run` 29 files / 230 passed; `bun run build` succeeded; Playwright 375px: `/nope-xyz` shows "This page isn't here", `/gb/not-a-real-place` shows "We don't have this place on record". Error screens (retry) not triggered live.
- [ ] Next: RLS policy review (needs human sign-off); entitlement seam (needs pricing decision).
- [x] Home list: when filters hide everything, it now says "Nothing matches these filters, but N other things are recorded here" with a "Show everything" reset, instead of falsely saying "Nothing recorded here yet". Count is announced to screen readers; filter buttons are 44px tall. Files: src/routes/index.tsx, src/components/layer-filter.tsx, src/lib/discovery-empty.ts(+test).
- Checks 2026-10-11 (2): tsgo clean; lint 0 errors / 8 existing warnings; vitest 30 files / 232 passed; build succeeded. Playwright 375px: all 8 filter buttons 44px; preview data has entries in every layer so the filtered-out message was not seen live (covered by unit test).

## 2026-10-11 trust-boundary audit (bounded, code-level)
Facts (verified in code): every write/private server action uses sign-in checks; `listSources`/`refreshSource` call `assertReviewer` before the admin client; database linter reported no issues.
Fixed: `moveConnectionRequest`, `findSupplyForNeed`, `refreshSource` passed caller input through unchecked. They now validate ids (uuid), status (known values), slug and day range (`src/lib/server-inputs.ts` + test). A malformed need id returns "not found".
Top risks (need human review, no change made):
1. `findSupplyForNeed` is public (no sign-in) and returns people candidates for any need anonymous visitors can read; exposure depends entirely on `needs`/`profiles`/`service_areas`/`person_capabilities` row-level policies — NOT VERIFIED end-to-end.
2. Admin-client reads inside public paths (`world.functions.ts` provenance, `findSupplyForNeed` blocks) bypass row-level rules; currently field-limited, but any edit there can leak. Needs owner sign-off before widening.
3. Exposed-schema settings and grant effectiveness: NOT VERIFIED (no settings evidence). Human approval needed for any policy/grant change.
Checks: tsgo clean; lint 0 errors/8 existing warnings; vitest 31 files/235 passed; build succeeded.
- [x] Found & fixed pre-existing dead end: `/need` page had a child (`/need/$id`) but no outlet, so opening any individual request showed the blank "What do you need?" form. Renamed `src/routes/need.tsx` → `src/routes/need.index.tsx` (route `/need/`); `/need` links unchanged. Server render of `/need/<id>` now returns the request page. Browser check in the sandbox preview still showed the locality "not on record" screen after load — likely a stale preview bundle; NEEDS MANUAL CHECK on a real request link. No public needs exist in data to test with.
- Checks after rename: build succeeded; tsgo clean; lint 0 errors/8 warnings; vitest 31/235 passed.

## 2026-10-11 sprint close-out
- Trust-boundary audit: closed. Top 3 risks unchanged (see above); all need human sign-off, no policy change made.
- [x] Verified live (Playwright, 1280px): `/need/<unknown uuid>` now shows "That need isn't here any more." — the request page, not the form or locality screen. Earlier result was a stale preview.
- [x] Regression test `src/lib/route-structure.test.ts` keeps `/need/` and `/need/$id` as siblings.
- Still needs a human: RLS/grant/exposed-schema review; real request with public data not tested.

## 2026-10-11 — Privacy boundary: suggested helpers on public requests
Trace: `/need/$id` (`src/routes/need.$id.tsx`) → `findSupplyForNeed` (`src/lib/needs.functions.ts`, public, no sign-in) → `publicServerClient()` (anon key, RLS applies) reads needs, profiles, person_capabilities, service_areas, availability_windows, opportunity_preferences, contribution_preferences, journeys/journey_places, listings, hour_offers → `findSupply()`.
Elevated (admin) credential use in this path: (1) `user_blocks` read to hide blocked people; (2) `signPhotos` signs profile-photo paths only for people already shown.
VERIFIED (read-only policy query, 2026-10-11): anon SELECT policies exist that hide private rows — needs (public/local_discovery + open), profiles (discoverable), capabilities/service areas/availability/preferences/contributions (visibility <> private + discoverable profile; availability also unexpired), journeys (public + opted-in + active + unexpired).
PROVEN GAP (fixed): a failed block-list read was ignored, so blocked people could appear. Now fails closed via `src/lib/block-filter.ts` `excludeBlocked` (3 tests).
POTENTIAL RISK (not proven): suggestions are visible to anyone with a request link, by design of the current policies — needs owner decision. `findSupply()` does not itself check visibility; it relies on RLS.
NOT VERIFIABLE here: table GRANTs effectiveness, exposed-schema settings, storage bucket policy for profile-photos.
Checks: tsgo clean; lint 0 errors/8 warnings; vitest 33 files/240 passed; build OK.
Human steps: confirm public suggestion visibility is intended; confirm grants/exposed schemas in backend settings.

## 2026-10-11 — Detail panel touch targets (phone)
Evidence (Playwright 375px): the item detail panel's Close button measured 16×16px; "Why not — save it" 36px and "Put the phone away and go" 38px tall — below 44px.
Fix: `src/components/ui/dialog.tsx` close button 44×44 (shared by all pop-ups); `src/components/entry-sheet.tsx` both action buttons `min-h-11`. Re-measured: 44×44, 44, 44.
Test: `src/lib/touch-targets.test.ts` (source-class guard; no DOM test library installed).
Checks: tsgo clean; lint 0 errors/8 warnings; vitest 34 files/242 passed; build OK.
Observed, not fixed: after Escape, focus lands on the page body rather than the item that opened the panel — next candidate.

## Lifelong map MVP (2026-10-11, owner-approved scope)

- [x] Private "Places I've known" (`place_memories`, owner-only rules, visibility locked to private). Page `/memories` with add/edit/delete, link to the existing place page for "what's there now". No new discovery logic.
- [x] Partial, labelled data download (memories, profile, capabilities, service areas, availability, saved items).
- [x] Item detail panel returns keyboard focus to what opened it.
- [x] Database isolation check (two users + visitor, rolled back): other user sees/edits/deletes 0 rows; visitor denied; "public" rejected.
- Checks: tsgo clean; lint 0 errors / 8 warnings; vitest 35 files / 254 passed; build succeeded.
- [ ] Not yet: browser check of /memories while signed in; focus return seen in a real browser; imports (phase 2); conversations/requests/reports in the export.

## Founding Local Partner pilot (2026-10-11, validation only)
- [x] `/partners`: proposed-pilot disclosure (€19/month = hypothesis, integer cents), deliverable-only benefits, asks, terms to confirm, private-data promise, interest form with consent. Submissions are NOT sent or saved (prototype); the person gets a copyable summary.
- [x] `/partner-tracker`: internal scorecard + targets (labelled hypotheses), stored only in this browser.
- Both noindex and in PRIVATE_PATHS. No payments, backend, schema or auth changes.
- [ ] Blocked on approval: storing interest submissions in the database (needs a new table) and a follow-up contact route.
- [ ] My Places full slice: plan awaiting approval (schema addition, location precision).


## 2026-10-20 — Work-opportunity contract reconciliation

- Fresh contract port from PR #174 onto canonical `main` at `14e409e90a027305902f381de3d0a9fbd912dc71`; the original feature branch remains unchanged for review.
- Scope: strict opportunity contract/parser and taxonomy safeguards only. It does not seed records, activate partner sources, change schema/RLS/grants, or contact anyone.
- The traveller-facing locality/request surfaces remain a separate integration dependency in #176; do not duplicate matching logic or change `findSupply()`.
- Previous head `a0316819ab164d367a8e40502e4336cc5d55405b` passed hosted Verify (run #1108); require fresh Verify on the reconciled head before review/merge.
- Human go/no-go still required for market-specific legal/policy review, source rights and actual supply approval. Australia remains NOT LIVE.


## 2026-10-20 — Adzuna parser → WorkOpportunity staging bridge

- Review branch `integration/adzuna-staging-bridge-2026-10-20` composes the fixture-first Adzuna parser with the reviewed `WorkOpportunity` bridge; it is a separate dependent slice after the contract PR.
- Every record remains non-publishable staging output: source rights are unreviewed, policy review is required, freshness is unknown, and engagement kind is not stated where the source does not establish it.
- Salary observations remain private parser evidence unless currency and pay basis are verified; public compensation stays not stated in that case.
- No live HTTP, credentials, database writes, scheduled ingestion, schema/RLS/grant changes, or source activation. Human approval remains required before publication.
