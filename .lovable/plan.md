# Living World: next-phase read-only audit and agent work plan

Labels: [O] observed this session, [I] inferred, [U] unknown. Nothing was edited apart from this plan, and nothing was committed, synced, published or written to the database.

## 1. Identity and branch gate (STOP condition)
- [O] HEAD is `5f06fc336a748cf37c6a06ac272bee4a387bd745`.
- [O] The local branch is `edit/edt-cb2afebf-…`, a Lovable edit branch.
- [O] The only remotes are Lovable internal storage (git and s3). There is no GitHub remote, so the GitHub sync destination cannot be seen from here.
- [U] Which GitHub branch Lovable writes to. Incident #133 and your earlier check suggest `main`.
- [O] The CI job is named `verify`. [U] Whether `main` requires it as a status check.
- **Result: the active sync target is NOT verifiable. Write-capable work stays blocked.**

Owner steps to clear the gate:
1. In Lovable, switch the GitHub branch to a non-main working branch.
2. On GitHub, protect `main`: pull request required, required check exactly `verify`, no bypass for the Lovable app.
3. Make one no-op commit and confirm it lands on the working branch.

## 2. Discovery surfaces and data
- [O] **Routes (21):**
  - `/`, `/$country/$place`
  - `/make`, `/need`, `/need/$id`, `/help`, `/give`, `/earn`
  - `/journey`, `/road-trip`, `/life-list`, `/memories`
  - `/profile`, `/conversations`, `/moderation`, `/sources`
  - `/partners`, `/partner-tracker`, `/auth`
  - `api/public/sitemap*`
- [O] **Map:** `living-map.tsx` and `map-view.ts`, with quiet/sparse/medium/dense levels.
- [O] **Feed:** `whats-here`, `whats-happening`, `entry-card`, `entry-sheet` and `trust-chip`, with trust labels from `trust.ts`.
- [O] **Search:** `possibility-front-door.tsx` and `search-context.ts`, which keep the place and the typed text. `/need` accepts the text. [O] help/give/journey do not.
- [O] **Data fetching:** `world.functions.ts` and `locality.functions.ts` are server functions. Discovery goes through `findSupply()` only (`supply-engine.ts`).
- [O] **Posting:**
  - listings via `/make`
  - hour_offers via `/give` and `/earn`
  - needs via `/need`
  - capabilities, availability and service areas via `/profile`
- [U] Whether owner withdraw/expire controls exist for listings. A `status` column exists [O]; the UI path was not traced.
- [O] **Demo and mock records:**
  - `fixtures/world-entries.ts` (704 lines), `people-and-needs.ts` and `supply.ts`: demonstration only, gated by `fixturesAllowed()`.
  - The ingestion fixture source.
  - The `/partners` form is not saved and says so.
  - `/partner-tracker` stores data in the browser only.
- [O] Live events are off because the Ticketmaster key is missing.

## 3. Trust, contact and safety
- [O] **Contact:** connection_requests and connection_messages, consent-based and saved to the database, with user_blocks filtering.
- [O] **Gap:** `connection_requests.need_id` is NOT NULL, so there is no way to contact someone about a listing or offer.
- [O] **Reports and moderation:** content_reports plus the `is_safety_reviewer` / `has_role` functions; review happens at `/moderation`.
- [O] RLS is enabled on all 22 tables (earlier read-only check).
- [U] Whether each policy is correct, and whether signed-out (`anon`) grants on private tables are excessive. These were flagged earlier and are still unresolved.
- [O] Google sign-in is not configured [I]; the first Google sign-in may fail.
- [O] There is no spam limiting on messages, requests or reports [I from earlier audit].

## 4. Code, migrations, tests, PRs
- [O] 30 files in `supabase/migrations` plus one in `drizzle/migrations` (place_memories). Two migration systems is a drift risk.
- [O] Ingestion: `src/lib/ingest/` contains contract, dedupe, freshness, normalise, registry, refresh.server, ticketmaster and fixture-source.
- [O] 39 test files, including sitemap-privacy, trust, supply-engine, geo-scope, search-context, demo-layer and moderation.
- [U] The open PR queue is not visible from here. The last known list was #131 (fixture gate, overlaps with code already on main), #155 (service area), #133 (incident), and #34/#43/#15/#28/#33/#47/#153–159.

## 5. Gap matrix
| Area | Today | Gap | Needs schema/RLS? |
|---|---|---|---|
| Global/regional config | [O] places have country_code, timezone and currency; [O] listing currency falls back to "GBP" | Jurisdiction policy module (age, regulated categories, consumer law per country); AUD default | Partly (config could be code-first) |
| Australian pilot | [O] none of the four towns appear in code or migrations; [U] whether live `places` has AU rows | Add the pilot town and its parent places | Yes, a data migration (approval) |
| Future payments (off in beta) | [O] cost is shown as text; integer-cents rule exists; no payment provider | A `payments_enabled=false` policy flag and a provider-neutral seam, with no provider | No |
| AI-ready | [O] `draft-assist` (proposal only) | Modular "AI proposes" seams per feature; no AI ranking | No |
| Jobs/events APIs | [O] ingestion registry and Ticketmaster adapter | AU event and job sources with licence checks; key setup | Secrets, plus possibly new source rows |
| Listing lifecycle | [O] status, starts/ends_at | Owner withdraw, automatic expiry filter, freshness prompts | [U] maybe none if RLS already allows owner updates |
| Contact on listings | [O] need-only | A listing/offer subject for requests | Yes |
| Trust/security | [O] RLS on; reports; blocks | Grant review, spam limits, Google sign-in, `.env` untracked | Yes (review) |
| Perf/a11y | [O] touch-target test; [U] mobile check of a quiet town | 375px audit, keyboard map/list, map lazy-load cost | No |

## 6. Conflicts with the PR queue
- [I] #131 overlaps with the fixture gate already on main. It needs a reconcile PR, not a re-implementation.
- [I] #155 owns the service-area semantics; leave `geo-scope.ts` to it.
- [U] Any PR touching `connection_requests` or `places` would conflict with the slice. Check the queue first.

## 7. Recommended slice and parallel packages
**Vertical slice: "One real listing lifecycle in one pilot town".**
```text
/au/<town> (honest quiet state) -> /make creates a listing -> it shows on the map and in the feed
 -> entry sheet -> enquire (blocked until contact-on-listing is approved)
 -> owner withdraws, or it expires -> it disappears from the map, feed, findSupply and the sitemap
```
**Independent packages** (each its own branch and PR, after the gate is cleared):
- **A. Pilot-town research** (no code): compare the four towns on population, seasonality, existing local sources and their licences, connectivity and community organisations, with cited sources only. The output is a decision memo.
- **B. Lifecycle frontend:** owner withdraw/expire controls and a freshness label. Frontend-only if the current RLS allows it [U]. Tests: hidden from all four surfaces.
- **C. Jurisdiction config, code-only:** a per-country policy object (currency, payments disabled, regulated categories). No schema changes.
- **D. Mobile and accessibility audit** of a quiet town and the map/list switch at 375px; fix only what it finds.
- **E. Security review** (read-only, then one gated migration): anon grants, spam limits, contact-on-listing design.
- **F. AU source assessment** for `ingest/registry` (licences, keys). No new ingestion path.

Packages B and C both touch the listing UI; sequence them, C after B. Package E blocks the enquire step of the slice.

## 8. Acceptance tests
- A listing created by account 1 shows only for its own place, with a "Stated by provider" label.
- Account 2 cannot edit or withdraw it (two-account test).
- After withdrawal or expiry it is gone from the map, the feed, `findSupply()` and the sitemap.
- Demonstration records never appear when NODE_ENV is production.
- A quiet AU town shows an honest empty state and ways to contribute, with no invented items.
- With payments disabled, there is no checkout or price commitment anywhere.
- At 375px: no horizontal scroll, 44px tap targets, keyboard reaches every control.
- CI `verify` (lint, test, build) is green on the PR commit.

## 9. Blockers
1. Sync target and required `verify` check (owner). **Hard stop for all writes.**
2. Approval for the AU place data migration.
3. Schema/RLS decision on contact-on-listing.
4. The PR queue is not visible from this workspace.
5. `.env` is still tracked (a person must remove it).
6. AU source keys and licences.
7. Not recorded: `roadmap.md` cannot be updated in plan mode. It will be updated when work is authorised.
