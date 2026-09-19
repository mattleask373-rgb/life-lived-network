# The Living World — Global Transformation Audit

Audit only. Nothing was changed. Findings come from the repository and the live database; anything I could not establish is marked UNKNOWN — REQUIRES VERIFICATION.

## A. CURRENT SYSTEM MAP

TanStack Start v1 (React 19, Vite, Tailwind v4), 7 flat routes, no route groups, no `_authenticated` subtree, no `src/routes/api/*`, no server functions anywhere.

```text
src/routes/  index · journey · life-list · give · make · profile · auth
src/components/  living-map · layer-filter · entry-card · entry-sheet
                 three-hours · do-something-today · layer-colour
src/lib/  world-data (demo data + types) · listings (real data)
          hours · life-list · intents · journey-engine
src/hooks/  use-session · use-life-list
src/integrations/supabase/  client (browser) · client.server (admin, unused)
          auth-middleware (unused) · auth-attacher (registered in start.ts)
```

All database reads and writes go through the **browser** Supabase client, called from components via React Query. `createServerFn`, `requireSupabaseAuth` and `supabaseAdmin` exist in the template but are used nowhere. There is no SSR data loading, no route loader, no caching layer, no ingestion path.

## B. CURRENT DATABASE

Four tables, all `public`, all FK'd to `auth.users`, no FKs between them.

- `profiles` — id, display_name, photo_url, intro, **location (free text)**, languages[], interests[], can_offer[], would_love_to[], can_teach[], wants_to_learn[], discoverable (default false), timestamps.
- `listings` — creator_id, kind, layer, title, summary, details[], place, neighbourhood, **x/y numeric (illustrative 0–100)**, when_text (free text), band, minutes, cost, currency (default EUR), give, social, outdoors, skills[], accessibility, people_needed, contact_note, status, data_quality, timestamps.
- `hour_offers` — user_id, title, detail, skills[], neighbourhood, when_text, minutes, direction (offering/asking), status.
- `saved_items` — user_id, ref (text, no FK), category, note.

No enums: kind/layer/band/status/data_quality/social/direction are all free `text`. No lat/lng, no timezone, no real dates — every time is a human string. **Indexes: primary keys only, plus one unique (user_id, ref).** No index on creator_id, status, layer, band, created_at.

All four tables currently hold **0 rows** — everything visible in the app is the 20 hard-coded demo entries.

Primitives that exist today: PERSON (profiles), partial CAPABILITY (skill arrays as free text), OPPORTUNITY (listings), partial NEED (`hour_offers.direction = asking`). Missing entirely: PLACE, EVENT, EXPERIENCE, PROJECT, COMMUNITY, BUSINESS, SERVICE, JOURNEY, and every named relationship except CREATED_BY (creator_id) and a soft OFFERS.

## C. CURRENT RLS / SECURITY

RLS is enabled with GRANTs on all four tables; policies are correct and owner-scoped.

- profiles: readable when `discoverable = true` OR owner; owner writes only.
- listings: readable when `status='published'` OR owner; owner writes only.
- hour_offers: `status='open'` readable by public (`anon` + `authenticated`); owner manages.
- saved_items: owner-only for all four verbs — genuinely private.

`handle_new_user` is SECURITY DEFINER with `search_path=public` and EXECUTE revoked from PUBLIC/anon/authenticated. Only publishable keys reach the client. Service-role key is never imported by client-reachable code. No `user_roles` table, no admin role, no reports, no blocks, no moderation, no messaging — so nothing to leak there yet, and no admin capability either.

Risks at scale (not bugs today): every read is a direct client query against an unindexed table with `.limit(100/200)` and no pagination; `hour_offers` exposes `neighbourhood` + free-text detail to anonymous readers, so a user can publish identifying information with no warning; no rate limiting on inserts, so listing/hour spam is unrestrained; no soft-delete or moderation state.

## D. CURRENT PROFILE / PEOPLE SYSTEM

Six free-text array fields plus one free-text `location` and a discoverability boolean. Against the future model: skills exist (unstructured), roles do not, qualifications do not, practical experience does not, service areas do not, availability does not, opportunity preferences do not (partially implied by `would_love_to`), journey context does not. There is no people search — `discoverable` is stored and never queried anywhere in the codebase. `photo_url` exists with no storage bucket behind it.

## E. CURRENT LISTING / NEED SYSTEM

`listings` is the closest thing to a universal entity and already carries type (`kind`, 9 values in `src/lib/listings.ts` KINDS), creator, status, provenance-ish (`data_quality`), cost/currency, duration, skills, accessibility, capacity. `rowToEntry()` normalises a listing into the same `WorldEntry` shape the demo data uses — that mapper is the single most valuable piece of architecture in the repo, because the UI already cannot tell where an entry came from.

Missing for a real Need model: structured dates/times, timezone, flexibility, payment model (only a signed number — negative means "pays"), budget range, qualification requirements, service area, visibility separate from status, provenance source, freshness timestamps distinct from `updated_at`, policy state. Demand is currently split between `hour_offers.direction='asking'` and nothing else — there is no first-class Need.

## F. CURRENT GEOGRAPHY

Everything geographic is illustrative or free text:

| Finding | Where | Class |
| --- | --- | --- |
| `PLACE = { name: "Lisbon", region: "Portugal" }` single hard-coded place | `src/lib/world-data.ts:95` | REPLACE |
| `x`/`y` 0–100 map coordinates (in the DB too) | world-data, `listings.x/y` | REPLACE |
| `neighbourhood` free text, no hierarchy | listings, hour_offers | EXTEND |
| `profiles.location` free text, placeholder "Lisbon" | `src/routes/profile.tsx:208` | EXTEND |
| No lat/lng, no PostGIS, no distance maths anywhere | — | REPLACE (add) |
| No timezone; all times human strings + 5 fixed bands | listings.band, world-data | REFACTOR |
| `€` hard-coded in UI formatters, `currency` column ignored | `layer-colour.ts:40`, journey-engine, journey/make/three-hours | REFACTOR |
| `<html lang="en">`, English-only copy | `__root.tsx` | EXTEND |
| 20 Lisbon demo entries mixed into live results | `fetchWorld()` | REMOVE (eventually) |
| Fixed 8 layers as a closed union type | world-data LayerId | KEEP for now / EXTEND |

There is no user location handling at all — no geolocation, no "near me", no country/region model, no service areas.

## G. CURRENT MAP

`src/components/living-map.tsx` is 86 lines: a hand-drawn SVG of hard-coded Lisbon-ish geometry (river, forest, streets) in a 0–100 viewBox, with absolutely-positioned pin buttons from `entry.x/y`. There is **no map-provider abstraction** — but the component boundary is clean: it takes `entries`, `activeId`, `onSelect` and nothing else. The props contract is reusable; the geometry and the x/y coordinate space are not. A real provider later needs real coordinates first; the component itself is a swap, not a refactor.

## H. CURRENT DISCOVERY

Four separate, unrelated deterministic scorers, all client-side, all over in-memory arrays:

1. `layer-filter` + `meaningfulVariety()` — the map's Everything view.
2. `intents.ts` — `doSomethingToday()`, `whyNot()` (operates on fetched world, including real listings).
3. `journey-engine.ts` — `whatIsPossible()` for "I have three hours" and `planJourney()`.
4. `hours.ts` — a plain list fetch, no scoring.

Constraints are partly encoded (cost, minutes, outdoors, social, layer, band, quality) and the scorers do produce explanations (`reason()`, intent blurbs) — the shape of a Discovery Engine exists, scattered. **Critical coupling: `journey-engine.ts` imports `ENTRIES` directly**, so "I have three hours" and the journey builder cannot see anything a real person posted. `intents.ts` correctly takes the world as a parameter.

## I. CURRENT JOURNEY SYSTEM

`planJourney()` slots demo entries into 3–5 time bands across 4 fixed shapes, sums spend/earn, and lists unverified steps. No origin, destination, route, legs, stops, transport, dates, or persistence — journeys exist only in component state and vanish on reload. No journey table, no overlap detection, no sharing. The demo entry `someone-north` ("Lisbon → Porto → Galicia") is a hand-written mock of same-journey discovery, not a system. Room for hitchhiking/journey connections exists conceptually but nothing in the schema supports it.

## J. CURRENT PROVIDER / API SYSTEM

None. Zero external integrations, zero adapters, zero normalisation pipeline beyond `rowToEntry`, no caching, no rate limiting, no attribution, no ingestion jobs, no cron. Secrets present are platform-managed only (Supabase keys, `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET`); no AI call is made anywhere in the code. `src/integrations/supabase/cron-auth.ts` exists unused.

## K. CURRENT DATA QUALITY

Genuinely good foundation: `DataQuality` has six states (unverified, community confirmed, verified, recently updated, may have changed, expired) with honest human labels in `QUALITY_LABEL`, every new listing defaults to `unverified`, expired items are filtered out of fetches and intents, and the journey engine surfaces an `uncertain` list. Missing: any distinction of *source* (user / business / official / external provider), separate availability state, freshness timestamps, and any mechanism that actually transitions a record between states — nothing ever sets `verified` or expires anything.

## L. CURRENT LIFE LIST / MEMORY

`saved_items` + `localStorage`, with a clean merge-on-sign-in in `use-life-list.ts`, six human categories, no counts or scores. `ref` is a bare text id pointing at either a demo string or a listing UUID with no FK — fragile but deliberately loose. Nothing about completion, memory, photos, or contribution history exists. There is no `status` progression (SAVED → PLANNED → ATTENDING → COMPLETED), so no real-world outcome is recorded anywhere.

## M. CURRENT UI / DESIGN SYSTEM

Keep permanently: `src/styles.css` tokens (paper/ink/land/water/forest, Fraunces + Karla, `paper-grain`, `card-paper`, `photo-placeholder`, `focus-ink`, reduced-motion), `layer-colour.ts` as the only colour resolver, `entry-card`, `entry-sheet`, `layer-filter`. shadcn/Radix is installed but the hand-made components carry the identity. No AI imagery, honest photo placeholders — intact. Weakness: `money()` and `duration()` are Euro/English-only.

## N. GLOBALISATION BLOCKERS

- **CRITICAL** — no real coordinates; x/y illustrative space is baked into the DB and the map.
- **CRITICAL** — no geography hierarchy (country → region → city → neighbourhood); locality is free text, so nothing can be queried by place.
- **CRITICAL** — single hard-coded `PLACE` (Lisbon) drives the home page and page title.
- **HIGH** — `journey-engine` hard-imports demo `ENTRIES`; real posts are invisible to two features.
- **HIGH** — no real date/time or timezone; only 5 relative bands.
- **HIGH** — demo entries merged into live results by `fetchWorld()`; real and fictional are indistinguishable at the data layer.
- **HIGH** — no indexes; every query is a full scan with a hard `limit`.
- **MEDIUM** — Euro hard-coded in formatters; `currency` column ignored.
- **MEDIUM** — no locality routes (`/lisbon`, `/brighton/gardeners`); one URL per page, so locality × intent discovery is impossible.
- **MEDIUM** — English-only strings, no i18n seam.
- **LOW** — closed 8-layer union; fine for now, needs a category table eventually.

## O. ARCHITECTURAL DEBT

1. `journey-engine`'s direct dependency on demo data (breaks its own stated abstraction).
2. Discovery logic duplicated across four modules with four scoring conventions.
3. All data access in the browser; no server boundary, so no caching, no aggregation, no ingestion, no rate limiting is possible without moving reads.
4. `cost` as a signed number encoding payment direction — will not survive payment models.
5. `saved_items.ref` polymorphic text with no FK and no entity-type column.
6. Free-text everywhere `text` should be an enum or lookup.
7. N+1-ish double fetch in `fetchCommunityEntries()` and `fetchHours()` (listings then profiles) — correct but will not scale.
8. Unused template machinery (`client.server`, `auth-middleware`, `cron-auth`) suggesting a server path that was never adopted.

## P. DUPLICATION

- Four scorers (map variety, intents, three-hours, journey) solving one relevance problem.
- Two "offer something" systems: `listings` (kind='skill') and `hour_offers` — overlapping fields, separate tables, separate pages (`/make`, `/give`).
- Two profile-name lookups implemented identically in `listings.ts` and `hours.ts`.
- Two "what I can give" vocabularies: `profiles.can_offer[]` and `listings.skills[]`/`hour_offers.skills[]`, unconnected.

## Q. REUSABLE FOUNDATIONS (protect)

`WorldEntry` as the single normalised view model; `rowToEntry()` as the normalisation seam; the `DataQuality` vocabulary and its honest labels; RLS policy design; explore-without-an-account; `discoverable` default false; approximate-location discipline; the design tokens and hand-made components; `LivingMap`'s props contract; the Life List's merge-on-sign-in; the "nothing worth recommending" honesty in intents and journeys.

## R. REFACTOR OPPORTUNITIES (small change, large unlock)

1. Make `journey-engine` accept entries as a parameter (like `intents` already does) — one signature change makes every real post visible to three-hours and journeys.
2. Introduce a `places` table and a `place_id` on listings — unlocks locality routing, distance, "near me", and local SEO at once.
3. Add lat/lng beside x/y rather than replacing it — the current map keeps working while real geography arrives.
4. Move `fetchWorld` behind one public `createServerFn` — unlocks caching, pagination, aggregation and ingestion with no UI change.
5. Add a `source` column to the quality model — turns data_quality into real provenance.

## S–Z. FUTURE (described only, not to be built now)

- **Database**: `places` (hierarchy with parent_id, country, admin levels, centroid, bbox, slug), `entity_locations`, `needs`, `capabilities` (person × skill × role, with separate qualification and experience records), `availability`, `service_areas`, `journeys` + `journey_legs`, `communities`, `organisations`, `outcomes`, `memories`, `connections`, `reports`, `blocks`, `sources`, `provider_records`, `user_roles`. Keep it relational in Postgres; no graph database.
- **Providers**: `provider → adapter → normalise → resolve → dedupe → provenance → freshness → policy → entity`, run as scheduled ingestion into our own tables, never at request time. One `sources` table, one adapter interface, attribution stored per record.
- **Geography**: real coordinates + PostGIS-style distance, place hierarchy as the spine, timezone per place, currency per place, locale per place; x/y becomes a purely presentational projection.
- **Discovery**: one server-side Possibility Engine (`src/lib/discovery/*` + a server function) taking an intent object and returning explained results; the four existing scorers become strategies inside it; AI sits only at intent-in and explanation-out.
- **People/capability**: extend `profiles` with structured capability/role/qualification/availability/service-area child tables, all opt-in, never inferring availability or professional standing.
- **Journeys**: persist journeys as legs with places and dates, then feed the journey as *context* into the same Discovery Engine (along-route, detour, overlap).
- **Locality SEO**: dynamic routes `/{country}/{place}` and `/{place}/{intent}`, driven by the `places` table and real record counts, with SSR heads — never generated keyword pages, and nothing published for a place with no real data.
- **Traffic**: external sources fill the cache, are always attributed and freshness-stamped, and are subordinate to human-posted records in ranking.

## AA. WHAT SHOULD NOT BE TOUCHED

The design tokens and hand-made components; the `WorldEntry` shape as consumed by the UI; RLS policies; explore-first behaviour; `discoverable` default false; `saved_items` privacy; the no-AI-imagery rule; the honest "nothing to recommend" paths; `src/integrations/supabase/client.ts`, `previewAuthStorage.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `.env`.

## AB. RECOMMENDED TRANSFORMATION ORDER

1. Geography spine: `places` table + real coordinates + place references on listings/profiles/hours.
2. Decouple discovery from demo data; separate demo from real at the data layer.
3. Move reads behind public server functions; add indexes and pagination.
4. Locality routing (`/{country}/{place}`) with the map driven by a place, not a constant.
5. Unify creation: listings + hour_offers into one entity model with kinds; introduce first-class Needs.
6. Structured capabilities, availability and service areas (opt-in).
7. One Discovery Engine; the four scorers become strategies.
8. Journeys persisted as legs, feeding Discovery as context.
9. Trust: sources, provenance, freshness transitions, reports, blocks, roles, moderation.
10. Outcomes and memory. 11. Providers/ingestion. 12. AI at intent and explanation only.

## AC. FIRST IMPLEMENTATION SLICE (recommended, not yet built)

**The geography spine, and nothing else.** A `places` table with hierarchy, slug, coordinates, country and timezone; `place_id` + real `lat`/`lng` added alongside the existing `x`/`y`; `PLACE` replaced by "the place you're looking at" resolved from a place record; Lisbon becomes the first row rather than a constant. The hand-drawn map keeps rendering from x/y, so nothing visible breaks. This is the one change every later capability depends on.

- **AD. Files likely to change**: `src/lib/world-data.ts`, `src/lib/listings.ts`, `src/lib/journey-engine.ts`, `src/routes/index.tsx`, `src/routes/make.tsx`, `src/routes/profile.tsx`, new `src/lib/places.ts`.
- **AE. Migrations likely**: create `places` (+ GRANTs, RLS, public read), add `place_id`/`lat`/`lng` to `listings`, `place_id` to `profiles` and `hour_offers`, indexes on `listings(status, place_id, band, created_at)`, seed Lisbon.
- **AF. RLS likely**: `places` public SELECT to anon/authenticated, writes service_role only; existing policies unchanged.
- **AG. Testing**: place resolution and slug uniqueness; listings render with and without `place_id`; map unchanged with x/y only; RLS checks that anon reads places but cannot write; signed-out explore still works end to end.
- **AH. Biggest risks**: committing to x/y as the coordinate system; letting demo data leak into a globally-marketed product; opening people search before capability and availability are opt-in and structured; unindexed client-side queries at scale; generating locality pages with no real local data.

## AI. FINAL RECOMMENDATION — the first architectural change

**Introduce a real geography model — a `places` table with hierarchy and true coordinates — and stop treating Lisbon as a constant.**

Everything else in the vision is downstream of it: "near me", "within 30 minutes", along-route, service areas, locality × intent URLs, timezones, currencies, and per-place ingestion all require a place spine and real coordinates. It can be added additively, with the hand-drawn map and the current UI untouched, which makes it the lowest-risk change with the highest unlock. Deciding it late means migrating data and rewriting discovery twice.
