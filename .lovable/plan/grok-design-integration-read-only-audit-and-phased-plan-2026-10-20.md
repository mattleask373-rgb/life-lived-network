# Grok design integration — read-only audit and phased plan

No files, settings, data or permissions changed. Labels: VERIFIED (seen this turn), INFERRED, UNKNOWN.

## 1. Source this project uses
- VERIFIED: working branch `edit/edt-c4e94701-...`, clean, head `2bb7d4d` (grounded-matching docs). Recent history includes `9269dff` "Redesigned home page in Grok style" (the earlier Lovable slice: tokens, fonts, CompassMark, mobile tabs, home hero).
- VERIFIED: only Lovable-internal git remotes; no GitHub remote, no `gh`, no GitHub connector.
- UNKNOWN: whether this project syncs to `mattleask373-rgb/life-lived-network`, which branch it syncs, and whether `2bb7d4d` equals GitHub main.
- UNKNOWN: PR #191 (`grok/a11y-entry-card-2026-10-20`, `d388b69`) is not present locally; its diff, mergeability and CI cannot be checked from here.
- INFERRED mismatch: PR #191 restyles EntryCard/PlacePicker/palette, while this project already changed palette and fonts in `src/styles.css` and `__root.tsx`. Both edit the same files, which likely explains mergeable=false.

## 2. UI surfaces and data paths (VERIFIED by file presence)
- Shell: `src/routes/__root.tsx` (header doors, MobileTabs, WorldProvider).
- Home: `src/routes/index.tsx`, `possibility-front-door.tsx`, `whats-happening.tsx`, `whats-here.tsx`, `three-hours.tsx`, `do-something-today.tsx`.
- Cards: `entry-card.tsx`, `entry-sheet.tsx`, `trust-chip.tsx`, `layer-icon.tsx`, `layer-colour.ts`.
- Place picker: `place-picker.tsx`, `place-search.tsx`, `src/lib/places.ts`, `world-context.tsx`.
- Map: `living-map.tsx`, `src/lib/map-view.ts`.
- Locality/service: `$country.$place.tsx` (layout), `$country.$place.index.tsx`, `$country.$place.$service.tsx`, `lib/locality*.ts`, `service-page.ts`, `services.ts`.
- Work/needs: `need.index.tsx`, `need.$id.tsx`, `earn.tsx`, `give.tsx`, `help.tsx`, `lib/needs.ts`, `earning.ts`, `hours.ts`.
- Discovery: `src/lib/supply-engine.ts` (`findSupply()`); server reads in `world.functions.ts`, `locality.functions.ts`; ingestion `src/lib/ingest/*`.
- VERIFIED: no symbol named `WorkOpportunity` exists in `src/`. The brief's contract name has no match here; the nearest are needs and earning helpers. Must be reconciled, not invented.

## 3. Backend (high level, from provided schema metadata; no queries run)
- Relevant tables: `places` (public read, writes denied), `listings` + `listing_photos`, `needs`, `hour_offers`, `person_capabilities`, `service_areas`, `availability_windows`, `journeys`/`journey_places`, `sources`/`source_records`, `profiles`, `saved_items`, `connection_requests`/`connection_messages`, `content_reports`, `user_blocks`, `user_roles`.
- All tables show RLS policies; role checks via `has_role` / `is_safety_reviewer`.
- Storage: private `profile-photos` bucket; one open security finding on photo visibility (owner decision pending).
- UNKNOWN: whether Lovable Cloud is the same backend the GitHub repo or other agents target. Earlier audit flagged a possible `connection_requests` update-policy weakness (unproven).
- None of the design phases below need backend changes.

## 4. Phased plan (frontend only, each a small reviewable PR)
```text
Phase 0  Reconcile        -> no code
Phase 1  Tokens/type      -> styles.css, __root.tsx
Phase 2  EntryCard        -> entry-card, trust-chip, layer-colour
Phase 3  PlacePicker      -> place-picker, place-search
Phase 4  Locality/service -> $country.$place.index, $service
Phase 5  Map + sheet      -> living-map, entry-sheet
Phase 6  Needs/work       -> need.*, earn, give, help
```
- Phase 0: diff PR #191 against this project's head; choose one owner for each shared file (keep this project's tokens, take #191's card/picker accessibility changes); record decision.
- Each phase: keep props, data sources and `findSupply()` calls unchanged; visual and accessibility changes only; preserve demo labels, provenance, trust chips and honest empty states; never port prototype data (Lisbon/Kyoto/Oaxaca, mock activity, Zustand store).
- Tests per phase: existing suite plus `touch-targets.test.ts`; add small tests only where a rule changes (e.g. demo label still shown). Run typecheck, lint, tests, build.
- Manual QA per phase: 375px and 1280px screenshots, keyboard-only pass, visible focus, 44px targets, contrast AA on new tokens, screen-reader labels on cards/picker, quiet locality (Herefordshire) and busy locality (Kings Heath).
- Human gates: approve Phase 0 decision; approve each PR after `verify` passes; any backend, schema, RLS, auth or new contract needs separate approval.

## 5. Blockers and evidence needed before implementation
1. Lovable Project Settings -> GitHub: screenshot showing linked repo name and synced branch (must not be `main`).
2. GitHub ruleset for `main`: PR required, `verify` required, no bypass for Lovable/bot accounts.
3. PR #191: current diff, conflict list, a `verify` run on its exact head, and owner decision to merge, rebase or treat as reference.
4. Confirmation that GitHub main matches `2bb7d4d` (or list of differing commits).
5. Confirmation which backend the GitHub repo/other agents use, matching this Lovable Cloud project.
6. Decision on the `WorkOpportunity` name: map to existing needs/earning, or a separately approved contract.
7. Open profile-photo visibility finding: owner choice (not a design blocker).
