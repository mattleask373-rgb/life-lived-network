# Read-only UX review — Australia Phase One (no implementation)

**Gate status: BLOCKED.** The GitHub link, the active sync branch and whether any work is uncommitted are all UNKNOWN. No project files, settings, branches, backend or data may change until the owner confirms them. This review read source files only. It sent no browser sessions, made no database queries and called no external services. Nothing in this review was RUN in a browser, so every result below comes from reading the code.

Legend: PASS = the code shows it is in place; FAIL = the code shows it is missing; UNKNOWN = the code alone can't settle it; NOT RUN = needs a live check.

## Flow inventory

| Flow | Result | Evidence |
| --- | --- | --- |
| Landing + search | PASS (code) / NOT RUN (browser) | `src/routes/index.tsx`, `src/components/possibility-front-door.tsx`, `src/lib/search-context.ts` + test |
| Choosing a real place (locality) | PASS (code) | `src/routes/$country.$place.tsx` (redirects to the canonical address), `src/lib/places.ts` (`splitPlaceFromQuery`, whole-word matches only), `src/components/place-picker.tsx` |
| Map + discovery | PASS (code) / NOT RUN | `src/components/living-map.tsx`, `src/lib/map-view.ts` + test, `src/lib/supply-engine.ts` (`findSupply`, the only matcher) |
| Work / services / events / experiences / community | PASS for the list layout; FAIL for live events | `entry-card.tsx`, `whats-here.tsx`, `whats-happening.tsx`, `src/lib/services.ts`; Ticketmaster key not set, so events come only from demo records, and those are switched off on the live site |
| Create a need + Help / Give | PASS (code) | `need.index.tsx` (pre-fills what was typed, never auto-submits), `need.$id.tsx`, `help.tsx`, `give.tsx`, `earn.tsx` |
| Journeys | PASS (code) / NOT RUN | `road-trip.tsx`, `journey.tsx`, `src/lib/road-trip*.ts` + tests |
| Profiles + privacy | PASS (code) / UNKNOWN (live rules) | `profile.tsx`, `memories.tsx` (owner-only), `sitemap-privacy.test.ts` |
| Sign-in + private pages | PASS (code) / NOT RUN | Every private page checks `useSession` inside the page itself (no `beforeLoad` guard). `auth.tsx`. Google sign-in setup UNKNOWN |
| Contact / save / join | PASS for contact on needs; FAIL for contact on listings; PARTIAL for saving | Contact: `conversations.tsx`, `connection.ts`. Listings can't be contacted because the conversations table only links to needs. Saving: the life list (`life-list.tsx`) is stored in this browser only. "Join": no feature found |
| Reporting + safety | PASS (code) / UNKNOWN (abuse limits) | `moderation.tsx`, `src/lib/moderation.ts`, `safety.ts` + tests. No spam/rate limits found |
| Empty / loading / error / stale | PASS (code) | `components/data-state.tsx`, `lib/discovery-empty.ts` + test, error and not-found pages in `__root.tsx`, `capability-freshness.ts` + test |
| Listing withdraw / expire | FAIL | `src/lib/listings.ts` only has `createListing` |

## Australia data evidence
- A search of `src/` and `supabase/migrations/` for Australia, Agnes Water, Yamba, Forster, Airlie or AU found **no Australian places in code or migrations**.
- Whether the live places list includes Australian towns is UNKNOWN; this review did not query it.
- Listing currency falls back to GBP, with no AUD default (seen in an earlier review).

## Tests
- Scripts: `test` (vitest run), `lint`, `build`. The verify workflow runs all three.
- There are 34 test files, all unit tests with no database access.
- Gaps: no two-account checks of who can see or change what, no browser checks at phone width (375px) or of private pages while signed out, no tests for listing withdraw/expire, and no tests that private pages turn away signed-out visitors.

## Founder / owner blockers
1. Confirm the repository, the sync branch, and that `main` requires a pull request and the `verify` check.
2. Approve adding Australian places to the database.
3. Decide on contact for listings (needs a database change).
4. Approve the conversation-update security fix.
5. Ticketmaster key (optional).
6. Check Google sign-in setup.

No files or settings may change until gate 1 is cleared. This plan file is the only thing written.
