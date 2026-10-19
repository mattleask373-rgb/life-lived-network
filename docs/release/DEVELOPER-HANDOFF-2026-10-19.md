# Developer Handoff — Living World / Real World Atlas
**Date:** 2026-10-19  
**Base:** `main` @ `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Coordination:** GitHub issue #125

## 1. Current architecture (observed)

- **Frontend:** TanStack Start + React 19, Vite, Tailwind.
- **Backend:** Supabase (Postgres + Auth + RLS). Server functions via `@tanstack/react-start`.
- **Canonical discovery:** Single deterministic engine `findSupply()` in `src/lib/supply-engine.ts`. Do not create a second matcher.
- **Geography:** Country-agnostic hierarchical model in `src/lib/places.ts` (`PlaceIndex`, ancestors/descendants, service-scope helpers). Default slug historically `uk-and-ireland`; made configurable in PR #170.
- **Service-area semantics:** On main, residence can still be treated as reach. Fixed in unmerged PR #163 (only explicit `serviceAreaPlaceIds` qualify).
- **Honesty invariants:** Codified in `docs/agents/INVARIANTS.md`. Quiet preferred over fabricated; unknown ≠ zero; fixtures must not leak.

## 2. Critical data flows

1. Locality selection → `WorldProvider` / `resolvePlaceFromIndex` → place index.
2. Discovery → server functions → `findSupply({ need, people, entries, geography })`.
3. Open needs → `getOpenNeeds` / `getOpenNeedsCount` (exact count + bounded scope in #154).
4. Need creation → authenticated `createNeed` with Zod validation + canonical place lookup (#169).
5. Conversations → connection_requests / connection_messages with RLS + intended least-privilege grants (#162).

## 3. Open PRs — recommended merge order

| Priority | PR | Head (short) | Verify | Notes |
|----------|----|--------------|--------|-------|
| 1 | #157 | d7b4c594 | SUCCESS | Remove tracked `.env` |
| 2 | #163 | 3fb33ac0 | SUCCESS | Service-area only |
| 3 | #170 | 59b89fb5 | SUCCESS | Configurable default locality |
| 4 | #154 | ad5dce30 | SUCCESS | Exact counts + fail-closed |
| 5 | #169 | d7006d4d | SUCCESS | Need input validation (after #154) |
| 6 | #166 | 0746ec3f | SUCCESS | Front-door context retention |
| 7 | #129 | 7461eaae | SUCCESS | robots.txt private paths (repo only) |
| 8 | #158 | 192682d9 | behind | Quiet “Surprise me” — needs rebase |
| — | #162/#161 | various | static only | Disposable-DB proof **NOT RUN** |

## 4. Test strategy & gaps

- Standard gate: `bun install --frozen-lockfile && bun run lint && bun run test && bun run build` (Verify workflow).
- Strong unit coverage on supply engine, geo-scope, open-needs bounds, need validation.
- Conversation isolation has a well-written integration test gated on local PostgreSQL; **not executed in CI**.
- End-to-end private-route / two-account matrix (#132) still open.
- No browser / mobile / accessibility automation results recorded in this cycle.

## 5. Environment & configuration (no secrets)

- `.env.example` (once #157 lands) documents required Supabase publishable variables.
- Optional: `VITE_DEFAULT_PLACE_SLUG` (PR #170) for deployment-specific default locality.
- Never commit real keys. Historical `.env` blob still exists until a separate scrub decision.

## 6. Known defects / limitations

- Tracked `.env` on main.
- Residence-as-service on main.
- Australian place records not present in repository; live DB status UNKNOWN.
- Live production `robots.txt` still platform-default Allow-all (repo fix in #129 unreleased).
- Conversation hardening migration unproven on disposable DB.

## 7. Recommended next 30-day engineering plan

Week 1: Merge P0 sequence above; obtain disposable-DB proof for #162 or explicitly scope it out.  
Week 2: Close #132 matrix; publish robots/sitemap fixes; confirm or load Australian geography under approved process.  
Week 3–4: Accessibility pass, performance on larger place sets, rights-checked external event providers if desired.

## 8. Reproduction / verification commands

```bash
bun install --frozen-lockfile
bun run lint
bun run test
bun run build
```

For conversation integration tests (requires local Postgres):
```bash
# set TEST_PG_* env vars then
bun run test src/lib/connection-policy-db.integration.test.ts
```
