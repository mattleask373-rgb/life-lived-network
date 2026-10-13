# Living World: east-coast Australia pilot, read-only audit and slice plan

Status: plan only. No edits, commits, syncs, publishes or database changes were made.

## 1. Project identity and branch evidence
| Item | State | Evidence |
|---|---|---|
| Project | Real World Atlas / Living World, published at life-lived-network.lovable.app | project URLs |
| HEAD | `5f06fc336a748cf37c6a06ac272bee4a387bd745` | `git rev-parse HEAD` (observed) |
| Local branch | `edit/edt-cb2afebf-…` (a Lovable edit branch, not GitHub) | `git branch --show-current` (observed) |
| Remotes | Only Lovable internal storage (git + s3). No GitHub remote | `git remote -v` (observed) |
| GitHub sync target | UNKNOWN from here. Earlier evidence (#133, your check) shows it writes to `main` | your earlier report |
| Required check "verify" | Workflow job is named `verify` in `.github/workflows/verify.yml` (observed). Whether branch protection requires it: UNKNOWN | file only |

To fix (owner, in GitHub/Lovable settings): switch the Lovable GitHub branch to a non-main working branch, protect `main` (PR required, required status check exactly `verify`, no direct pushes, including for the Lovable app), then confirm with one harmless commit that it lands on the working branch.

## 2. Reusable capabilities (observed in code)
- **Map:** `src/components/living-map.tsx`, `src/lib/map-view.ts` (quiet/sparse/medium/dense).
- **Feed/list:** `whats-here.tsx`, `whats-happening.tsx`, `entry-card.tsx`, `entry-sheet.tsx` (details plus provider block), `trust-chip.tsx` / `src/lib/trust.ts`.
- **Search:** `possibility-front-door.tsx`, `src/lib/search-context.ts`, `splitPlaceFromQuery` in `places.ts`; `/need` keeps the typed text.
- **Posting:** `/make` (listings), `/give` and `/earn` (hour_offers), `/need` (needs), `/profile` (capabilities, availability, service areas).
- **Contact:** `/conversations`, using connection_requests and connection_messages with user_blocks. Consent-based and saved to the database. It is tied to a **need** (`need_id` is required).
- **Moderation:** `/moderation`, content_reports, `is_safety_reviewer`.
- **Discovery:** `findSupply()` only. Ingestion: `src/lib/ingest/*` (Ticketmaster key missing, so live events are off).

## 3. Routes and data for a local vertical slice
`/`, `/$country/$place`, `/make`, `/need`, `/need/$id`, `/conversations`, `/moderation`, `/sources`, sitemaps. Tables: places (read-only to users), listings (status, starts/ends_at, origin, demonstration flag), needs (status, expires_at), connection_*.

## 4. Smallest end-to-end slice (proposed)
```text
browse /au/<town> -> open entry sheet -> create listing in /make
 -> see it on map + list for that town -> "Ask about this" via connection request
 -> owner withdraws/expires it -> it disappears from map, list and sitemap
```
Two hard dependencies stand in the way:
- **No Australian towns found.** A text search for Agnes Water, Yamba, Forster and Airlie Beach found nothing in the code or migrations. The live `places` table was not queried this turn: UNKNOWN. `places` cannot be written by users, so adding a town needs an approved data migration.
- **Contact needs a need.** `connection_requests.need_id` is NOT NULL, so contacting someone about a *listing* has no authorised path today. That needs a schema/RLS change, or a decision to reuse needs.

## 5. UX gaps and acceptance criteria
- A quiet town shows an honest empty state and ways to contribute (check at 375px).
- A new listing shows "Stated by provider" or "Not stated", plus its freshness.
- Withdraw/expire is visible to the owner only and takes effect right away; check whether the owner controls exist in `/make`: UNKNOWN (status field observed, controls not traced).
- Keyboard and screen-reader access for the map/list switch; 44px touch targets (an existing test).
- Acceptance tests:
  - A created listing appears for its own place only.
  - A withdrawn or expired listing is gone from the map, the list, `findSupply` and the sitemap.
  - Another account cannot edit it.
  - Demonstration records never appear in production.

## 6. Frontend-only vs needs backend review
- **Frontend-only:**
  - empty states
  - trust labels
  - withdraw UI, if the status update is already allowed by the current rules
  - feed/map coordination
  - search carry-through for help/give/journey
- **Backend/schema/RLS review:**
  - adding the AU pilot town
  - listing-based contact
  - expiry enforcement (needs a cron or a query filter, to be checked)
  - spam limits
  - removing signed-out grants (open from the earlier audit)

## 7. Mock or seemingly complete features
- `src/lib/fixtures/world-entries.ts` (704 lines) and `people-and-needs.ts`: demonstration only, gated by `fixturesAllowed()`.
- The ingestion fixture source.
- `/partners` form: not saved, and says so.
- `/partner-tracker`: browser-only.
- Live events: off, because the key is missing.
- The production locality data is probably UK only (inferred from the place tests); AU coverage is UNKNOWN.

## 8. First bounded task and blockers
**First task (still read-only):**
- run a read-only query of `places` for AU rows and listing counts per status
- trace the withdraw/expire paths in `/make` and the listing filters
- then write a short pilot-town comparison of the four towns: population, seasonality, existing listing sources, licensing terms. This is research only, with cited sources and no invented figures.

**Blockers:**
1. The sync branch must move off `main`, and `verify` must be a required check (owner).
2. Adding an AU pilot town needs approval for a data migration.
3. Listing-based contact needs a schema/RLS decision.
4. GitHub PR visibility is UNKNOWN from this workspace.
5. `.env` is still tracked; removing it needs a person.

Invariants kept: `findSupply()` stays the only matcher, `ingest/*` stays the only ingestion path, nothing is invented, no payments, no deployment.
