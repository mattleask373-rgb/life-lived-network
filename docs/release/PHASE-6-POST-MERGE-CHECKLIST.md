# Phase 6 — Post-Merge Verification Checklist
**Last verified:** 2026-10-19 09:34 Europe/London (GitHub repository, PR and ruleset metadata rechecked; no live runtime or production test).  
**Verified main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Use immediately after each of the P0 merges**

## After #157 (env hygiene)
- [ ] Root `.env` no longer present on main
- [ ] `.env.example` present and contains only placeholders
- [ ] `.gitignore` correctly ignores `.env` / `.env.*` while allowing `.env.example`
- [ ] `bun install && bun run lint && bun run test && bun run build` still passes on new main
- [ ] Decision recorded on whether a history scan / credential rotation is needed

## After #163 (service-area only)
- [ ] `geographicReach` / equivalent no longer treats residence alone as service coverage
- [ ] Existing supply-engine tests pass
- [ ] Manual or test confirmation: a person who only lives in a locality does **not** appear as supply there

## After #170 (configurable default locality)
- [ ] Default falls back safely when `VITE_DEFAULT_PLACE_SLUG` is unset
- [ ] Invalid / missing configured slug does not silently present a wrong locality as current
- [ ] Homepage / entry copy remains region-neutral where intended

## After #154 (exact counts)
- [ ] Open-need counts use exact database count, not list length
- [ ] Empty or oversized place scope fails closed (no accidental global results)
- [ ] Loading / error / zero states remain distinct

## After #169 (need validation)
- [ ] `createNeed` rejects invalid payloads
- [ ] Place name / coordinates / timezone are taken from canonical `places` row, not trusted client input
- [ ] Missing place stays honestly unlocated

## Final limited-beta gate (after all five)
- [ ] New main SHA recorded in #125
- [ ] Verify workflow green on that SHA
- [ ] Conversation isolation still explicitly excluded (unless disposable-DB proof landed)
- [ ] Australia still explicitly excluded (unless data gate closed)
- [ ] Live robots.txt checked only after an authorised publish
- [ ] Google meeting materials updated to match actual merged scope


## Execution protocol — exact commands and expected result

**Run after each human-authorised merge**, not just once at the end. Start in a local clone; preserve any existing uncommitted work. If branch switching or a fast-forward pull is refused, stop and resolve the local state without resetting, cleaning, or overwriting work.

    git fetch origin
    git switch main
    git pull --ff-only origin main
    git rev-parse HEAD
    git status --short

Expected: HEAD matches the freshly fetched GitHub main SHA, the pull is fast-forward only, and the working tree has no unexpected changes. Record the full SHA in issue #125. Do not continue if the SHA differs from GitHub or if a pull would overwrite local work.

Run the scripts actually defined in the repository's package.json, individually so the first failure is visible:

    bun --version
    bun install --frozen-lockfile
    bun run lint
    bun run test
    bun run build

Expected: every command exits 0. The package scripts observed on the authorized branch are lint (ESLint), test (Vitest run), and build (Vite build); no separate typecheck script was present in that package.json snapshot. This document update did not execute these commands.

### After #157 — env hygiene
- Confirm root .env is no longer tracked without printing its contents:

      if git ls-files --error-unmatch .env >/dev/null 2>&1; then echo "FAIL: .env remains tracked"; else echo "PASS: root .env is not tracked"; fi
      test -f .env.example && echo "PASS: .env.example exists" || echo "FAIL: .env.example missing"
      git check-ignore -v .env

- Confirm .env.example contains placeholders only through a safe review; do not paste any secret values into issue comments or logs.
- Determine separately whether any real credential was ever exposed in Git history. Removal from the latest tree does not scrub old commits. Never print secret values. Founder decides any required rotations.

### After #163 — service-area truth
- Run the full test suite above.
- Review the focused supply-engine tests and confirm a person's residence alone does not satisfy service coverage.
- If automated tests do not explicitly cover that negative case, record the gap rather than inferring it from a green general suite.

### After #170 — configurable default locality
- Run the full test suite above.
- Confirm the configured default slug is parsed from the documented build/runtime environment, the fallback is deliberate, and an invalid slug cannot silently misrepresent the user's current locality.
- Record which environment is verified; local build success does not prove the published hosting environment has the variable set.

### After #154 — exact open-need counts
- Run the full test suite above.
- Confirm the open-need count comes from an exact count query, bounded locality scope is enforced, and unknown/error states remain distinct from zero.
- Verify missing or oversized place scopes fail closed rather than returning a global list.

### After #169 — need validation
- Run the full test suite above.
- Confirm malformed payloads are rejected server-side and canonical place fields are derived from the authoritative place record, not client-supplied coordinates, labels or timezone.
- Since #154 and #169 touch adjacent need/discovery behavior, run the combined suite after both changes.

## Final evidence record
Record for each merge: PR number, resulting main SHA, GitHub Verify run URL and conclusion for that exact SHA, local command exit codes if run, specific focused assertions reviewed, and any skipped checks. A skipped Supabase Preview is not a pass, and a green Verify check is not proof of database RLS isolation or deployed production behavior.

## Friday success — 23 October 2026
A conditional limited beta may be considered only if all five merges have formal approvals, exact-head checks and resolved threads; the post-merge suite is green on the final main SHA; any remaining defects are disclosed; and supported geographic data, scope and copy match the implementation. Conversation isolation remains explicitly **not database-proven** unless the safe multi-account suite actually passes on a confirmed disposable DB. Australia remains out of scope while live data coverage is unknown.
