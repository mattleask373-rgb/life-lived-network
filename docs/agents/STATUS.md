# Agent System Status — 2026-10-07 (control-tower reconciliation)

## SOURCE OF TRUTH

Repository evidence on `main`, GitHub Actions, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active.

## CURRENT QUEUE

### P0 / HUMAN-GATED CONTROL PLANE
- **Persistent autonomous executor:** MISSING. The repository contains provider-neutral orchestration and lease/fencing contracts, but no evidence yet proves a durable authenticated executor loop.
- **PR #61 — provider-neutral orchestration:** open; formatting fixes and lockfile reconciliation have been pushed. Fresh Verify is required.
- **PR #62 — claim/lease/heartbeat:** open; formatting fixes and lockfile reconciliation have been pushed. Its lifecycle contract still requires reconciliation with durable `agent_tasks.status` and expiry/fencing semantics before integration.
- **PR #64 — lease fencing / provider authorization hardening:** open; package/lockfile reconciliation pushed. Known security gates remain: authenticated owner/run binding, approval_id-bound human integration, tenant/project scoping, and live Supabase migration/RLS verification.
- **No production execution authority, autonomous merge, or deploy authority is enabled by this status file.**
- **#74 — CONTROL-PLANE-01:** open human-gated follow-up for the missing/proven durable persistence boundary, authenticated fencing and RLS reconciliation.

### AI-NATIVE PROGRAMME
- **PR #67 — ProgrammeState:** open; implementation is green on its prior head, but the current hosted Verify surface must be rechecked after branch/base reconciliation.
- **PR #69 — Experiment Engine:** open draft; current head contains formatting/syntax fixes. Hosted Verify currently fails before lint/test/build on frozen-lockfile reconciliation in the PR merge context; no green claim until a fresh run passes.
- **PR #72 — lockfile reconciliation:** open draft; one-line manifest fix to align `@lovable.dev/vite-tanstack-config` with the lockfile. Human action remains required; not merged.
- **PR #73 — accepted experiment → bounded task adapter:** open draft; intentionally no execution/persistence/provider authority.

### PRODUCT / REAL-WORLD SURFACE
- **Canonical supply engine:** REAL and live on main. `src/lib/supply-engine.ts` contains the real deterministic `findSupply()` implementation and regression tests. It is the sole possibility/discovery authority.
- **Ingestion architecture:** `src/lib/ingest/*` remains the canonical provider-neutral boundary. PR #49 is the reconciliation anchor; PR #43's parallel `external-world.ts` path must be absorbed/retired before integration.
- **Map/locality:** PR #54 visual language, #57 map-first locality integration, #60 sparse-locality progressive disclosure remain human-gated. #57 depends on #54; #58 depends on #49.
- **Journey trust:** PR #59 hardens stale/cancelled journey eligibility and remains human-gated.
- **Search context:** PR #52 preserves search intent into canonical locality discovery without creating a second matcher.

## VERIFIED CURRENT FINDINGS

- Main no longer has the historical supply-engine stub; the canonical implementation and tests are present.
- No second matcher/ranker/discovery engine is authorized.
- Unknown/absence remains distinct from real-world absence.
- No fabricated inventory, availability, demand, learner capability, or external-world activity is permitted.
- Human gates remain required for production autonomy, security/RLS/privacy, irreversible semantics, external side effects, legal/commercial consequences, and consequential learner decisions.

## CI / DRIFT

- PR #61 latest failed Verify because lint ran and reported formatting-only Prettier errors; those files have now been formatted. A subsequent run must also clear the frozen-lockfile mismatch.
- PR #62 latest failed Verify on formatting-only Prettier errors; those files have now been formatted. No new Verify result is yet evidenced.
- PR #64 latest Verify failed at `bun install --frozen-lockfile`; its branch declared `@lovable.dev/vite-tanstack-config` 2.25.x while the lockfile resolves 2.26.0. Manifest reconciliation has been pushed.
- PR #67 latest observed Verify failed at frozen-lockfile because its branch manifest still differed from the lockfile in the hosted merge context. This is a CI/base-drift issue, not a ProgrammeState behaviour failure.
- PR #69 latest observed Verify failed at frozen-lockfile in the hosted PR merge context. The head manifest already declares 2.26.0; fresh hosted verification is required to determine whether the merge ref still inherits a stale manifest/lock combination.
- PR #72 Verify is green on its exact head, but the fix is not merged.
- Product PRs #54/#43/#49 are based on an older main lineage; #52/#57/#58 are intentionally dependent/diverged. Do not flatten those dependencies without review.

## NEXT

1. Re-run/observe fresh Verify on #61/#62/#64 after formatting + manifest reconciliation; diagnose only remaining behavioural/security failures.
2. Reconcile #62's lifecycle model with the durable SQL status contract and authenticated fencing boundaries before any integration.
3. Reconcile #43 into #49's canonical ingest boundary; preserve useful fixture/normalization/freshness/provenance evidence while retiring the parallel architecture.
4. Keep #72, #69, #67, #73 and all control-plane work human-gated; no merge performed by the control tower.


## 2026-10-20 — Reviewed work-opportunity surfaces (PR #176 reconciliation)

- Reconciled the work presentation/read path with current main plus the contract and taxonomy from #174, without rewriting the original #176 branch history.
- The existing listing normalization seam accepts an optional `work_opportunity` payload and fails closed unless the strict contract says its publication, market-policy and rights gates are satisfied. Missing payloads remain missing; this does not create database columns or records.
- Locality and service-locality UI can show recorded terms through the same helper, and the "Request a match" link only prefills the existing need flow. It does not message a source; posting a need still requires an account in the current UI.
- `findSupply()` remains the single discovery authority. No entry-card/entry-sheet edits are carried here, to keep Grok's #177 accessibility pass separate.
- No real work rows or partner feeds are activated. Fresh hosted Verify on the reconciled head is required; no local test run or manual mobile/accessibility check is claimed.


## 2026-10-20 — SEO gate integration over the opportunity surfaces (PR #173)

- Reconciled the SEO gate/sitemap slice on top of the current-main work-opportunity surface branch (`5944f38a54b36f808de823bc293f383f086e64a4`), preserving the prior SEO branch history and using the opportunity branch as the second merge parent.
- Current locality and service-locality routes retain the existing interaction design and work-opportunity details. Shared four-state indexability decisions now drive route metadata and dynamic sitemap eligibility.
- Work-opportunity entries enter category pages and the service-locality SEO/sitemap gate only when `hasPublicWorkOpportunity()` confirms a published, human-policy-approved, rights-cleared contract payload. The existing listing normalizer rejects invalid payloads.
- BreadcrumbList schema matches visible breadcrumb facts; dynamic place URL candidates use the same exact-place scope as the rendered locality route. Failed or incomplete scans fail closed. `findSupply()` remains the sole discovery authority.
- Verify succeeded on the pre-integration SEO head `79fc4559dd48ffa452b76073bae9b2735bc29343` (run #1318), but a fresh run is required for this combined head. No local tests, live crawl, Search Console or deployed sitemap checks are claimed.
- Event/LocalBusiness/provider schema, real inventory, rights-cleared source supply at pilot scale, accountless enquiry/contact, and mobile/accessibility checks remain outstanding human/ops gates. Australia remains **NOT LIVE**.


## 2026-10-20 — Conservative Event and LocalBusiness structured data (PR #173)

- Locality pages now add `Event` JSON-LD only for non-demo, currently verified event records with an explicit offset-aware start instant, valid IANA timezone, a non-generic recorded place label, and no cancellation. Invalid or incomplete event facts produce no schema; ticket price/availability/organiser type is never inferred.
- Locality pages add `LocalBusiness` only for an explicitly named provider with a verified current service record and a public booking/source URL. The schema uses the locality as `areaServed`; the model has no verified business street address, so address/geo fields are deliberately omitted rather than invented.
- Regression tests cover malformed dates/timezones, demo/cancelled/unverified events, generic place labels, missing business identity/URL, and absence of fabricated address/geo/offer properties.
- These schemas are attached to the locality page UI, not separate event routes. Dedicated event/provider sitemaps and address-grade business data remain separate gates. Fresh hosted Verify is required for the next SEO branch head; no local test run was performed.


## Verification checkpoint — 2026-10-20 (SEO/schema code head)

- Hosted Verify **passed** on the SEO, work-surface integration, and Event/LocalBusiness schema code head `571f49e069299cdff42c939990ff701d36a20844`: [run #1339](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39427456329). Frozen install, lint, Vitest and production build all passed.
- This is evidence for the code head above. The status/roadmap-only commit recording it requires its own fresh exact-head Verify before merge. Manual mobile/accessibility QA, live crawl/Search Console, real public inventory and human review remain open.
