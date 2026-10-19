# Phase 6 — Post-Merge Verification Checklist
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
