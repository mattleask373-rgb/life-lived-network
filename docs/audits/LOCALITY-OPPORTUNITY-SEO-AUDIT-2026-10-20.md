# Locality, opportunity and public-discovery audit — 2026-10-20

**Scope:** read-only source and open-PR review against `main` at `9269dff0fb66911733ea309fd7342d86bb60c112`.
**Evidence limits:** GitHub file/API reads only. No local checkout, test run, live database inspection, deployed-page fetch, or manual browser/screen-reader QA was performed for this audit.

## Executive summary

The architecture has the right core boundary: `src/lib/supply-engine.ts` owns `findSupply()`, and locality/service discovery uses existing `WorldEntry` records plus the shared service taxonomy. Work-opportunity changes should extend that path rather than introduce a second matcher, feed, or source of availability.

The immediate risk is **integration drift across open PRs**, not a need for a new architecture. PRs #173, #174, #175 and #176 are based on older main lineages; GitHub reports the first, second and fourth as non-mergeable at the observed snapshot, and the comparison shows those heads diverged from current main. PR #176 also changes `src/components/entry-card.tsx`, which overlaps the visual slice in PR #177. Reconcile against current main and run Verify on the final candidate head before any merge decision.

## Current-main architecture observed

- `src/lib/supply-engine.ts` exports the deterministic `findSupply(input)` entry point. It consumes a need, people, normalised `WorldEntry` records and optional geography, and returns named result bands with explicit caveats. Keep this as the only discovery/matching authority.
- `src/lib/service-taxonomy.ts` currently models service categories and groups including home/garden, community and events. Existing categories include gardening, cleaning, repairs/odd jobs, volunteering, venue hire and event services.
- Taxonomy matching is evidence-based: a declared service category stands alone; otherwise categories match words present in the record's own title, summary, skills, kind or organisation. That is useful for service grouping, but word matching alone must never qualify a work opportunity for publication.
- `src/lib/service-page.ts` separates real records from labelled demonstrations and makes a service page indexable only when at least one genuine current listing exists.
- `src/lib/seo.ts` centralises canonical URL, public/private metadata, crawler paths and sitemap XML helpers. The roadmap identifies the fuller explainable indexability gate and dynamic locality/service sitemaps as release dependencies; treat current route/indexability status as code-level evidence, not proof of deployed crawler behaviour.

## Opportunity taxonomy and contract: integration rules

PR #174's proposed `work-opportunities.ts` contract adds structured arrangement, engagement kind, compensation, dates, conditions, provenance, rights, review and publication state. Its taxonomy extension adds hospitality shifts, event work, seasonal work, short-term work and longer-term roles. PR #176 adds presentation facts, listing normalisation and a request path through the existing `/need` flow.

Preserve these boundaries when integrating:

1. **Publication gate before presentation.** Only explicitly typed, current, rights-cleared, human-policy-reviewed and published records may surface as public work opportunities. A taxonomy word match or `serviceCategory` value alone is not proof of publication eligibility.
2. **Do not collapse compensation states.** Paid, explicitly unpaid and not stated must remain distinct. Currency and pay basis must be explicit; never infer a pay rate, employment status, qualification, availability, accommodation or transport.
3. **Reuse existing records and discovery.** Normalise optional opportunity payloads at the existing listing-to-`WorldEntry` seam. A request CTA should create/use the existing need flow and let `findSupply()` answer it; it must not imply a provider was contacted or that a match exists before the canonical result says so.
4. **Do not make volunteering synonymise unpaid employment.** Keep engagement kind distinct from compensation and arrangement. Market-specific legal classification remains a human review requirement.
5. **Keep demonstration and incomplete data out of real supply.** Demo, malformed, stale, cancelled, draft, rights-restricted or unreviewed rows cannot count as real listings or make a locality/service page indexable.

## Open-PR integration and ownership

Snapshot checked 2026-10-20 through GitHub API:

- [PR #173 — gated locality/service-locality routes](https://github.com/mattleask373-rgb/life-lived-network/pull/173): base SHA `f2de6d8d76bdabbd98639f4bf4837573c96587cc`; head `3b835f41e70a88eadca323f3f385a12e5b8a94ce`; reported non-mergeable. It introduces an indexability gate, structured breadcrumbs and dynamic sitemap enumeration. Review its changed routes, generated route tree, sitemap/robots logic and canonical locality/service helpers against current main before integration. The PR itself says no live sitemap/crawler/database completeness check was performed.
- [PR #174 — reviewed opportunity contract and traveller taxonomy](https://github.com/mattleask373-rgb/life-lived-network/pull/174): base SHA `0c56cc299825dea5996323506e7a1cc9266975c8`; head `a0316819ab164d367a8e40502e4336cc5d55405b`; reported non-mergeable and diverged from current main. Reconcile its taxonomy and `WorldEntry` additions against current main; do not merge an old-base snapshot blindly.
- [PR #175 — non-writing place staging validator](https://github.com/mattleask373-rgb/life-lived-network/pull/175): base SHA `f2de6d8d76bdabbd98639f4bf4837573c96587cc`; head `852a8b8db850b5fc103b1e0f57e61b23b8e0178a`; reported mergeable at the snapshot but still diverged from current main. It is staging validation only, not live Australian inventory or authority to import/publish any place.
- [PR #176 — reviewed opportunity surfaces](https://github.com/mattleask373-rgb/life-lived-network/pull/176): base SHA `f2de6d8d76bdabbd98639f4bf4837573c96587cc`; head `17382eee7aee7661a81a1b41af8ff9d990b06e4f`; reported non-mergeable and diverged from current main. It carries the opportunity contract/taxonomy changes as well as presentation/listing/request-path work, so coordinate its dependency with #174 instead of integrating duplicate copies.
- [PR #177 — Grok visual integration](https://github.com/mattleask373-rgb/life-lived-network/pull/177): base is current main SHA `9269dff0fb66911733ea309fd7342d86bb60c112`; head `9e513856f4e8f67ac205ecaabfdea82b164087b2`; reported mergeable. #176 and #177 both change `src/components/entry-card.tsx`. If #177 lands first, rebase/reconcile #176's card changes on the new main and preserve both the photo/provenance/empty fallback and the opportunity facts. Do not overwrite either agent's implementation.

These are observations at the cited snapshot, not a merge recommendation. A green check on an old head is not evidence for a reconciled head.

## Focused test matrix for integration

| Area | Regression cases required |
|---|---|
| Work publication | Valid reviewed + rights-cleared + published record can surface; draft, demonstration, malformed, stale, cancelled, rights-restricted and unreviewed records cannot. |
| Pay and terms | Integer minor units; explicit ISO currency and basis; paid / explicitly unpaid / not stated remain distinct; missing dates, duration, accommodation, conditions and transport stay unknown rather than inferred. |
| Taxonomy | Existing gardening/cleaning/odd-job/community/event categories remain stable; work categories only accept publishable work records; keyword overlap cannot bypass the publication gate; category evidence remains inspectable. |
| Canonical discovery | Request-match action uses the existing need route and `findSupply()`; no parallel matcher/ranker, auto-contact, inferred availability or claim of guaranteed placement. |
| Locality pages | Empty and demonstration-only pages remain non-indexable; a real current record is required for indexability; unknown place/service gives the existing honest not-found path; wrong country segment redirects to one canonical URL. |
| Sitemap / structured data | Sitemap contains only candidates admitted by the same indexability gate used for page metadata; failed/incomplete scans fail closed; JSON-LD mirrors visible breadcrumbs and canonical URLs; private paths never enter sitemap output. |
| Visual integration | At 375px and 1280px, opportunity facts fit without horizontal overflow; cards retain photo credit/trust/demo/currency/source; keyboard focus is visible and order sensible; no nested interactive controls; screen-reader names and touch targets are verified manually. |

## PR #177 independent UX/a11y review notes

- Positive source-level evidence: card photos come from `WorldEntry.photos`; missing photos use an explicit neutral placeholder; photo credit, trust chip, demonstration label, service/provider, source, timing and money display are retained. Place search input is inside a label, search results have an accessible label/status, and locality chips use `min-h-11` (44 CSS px under Tailwind's default spacing).
- **Manual verification still required:** actual 375px/1280px screenshots, keyboard-only flow, screen-reader pass, contrast measurements against rendered states, and checking long place names / result labels. Source classes and static tests do not prove these.
- **Markup review item:** the clickable `EntryCard` renders block elements (including `div`, headings and paragraphs) inside a `button`. This structure is outside the button's phrasing-content model. It predates or is retained by the visual slice, but should be resolved in a separately reviewed accessibility change (for example, use a semantic card with a clearly labelled action rather than invalid nested structure) and covered by rendered-DOM/accessibility tests. Avoid bundling that refactor into #177 without agreement because #176 also edits this component.
- `grok-visual-foundation.test.ts` asserts source strings/classes and token presence. Keep it as a guard, but supplement it with component/rendered accessibility assertions; string tests cannot prove computed contrast, keyboard behaviour, or actual target geometry.

## Suggested sequence

1. Human reviewers decide the integration order for #173–#177; no merge by this audit.
2. Reconcile the work contract/taxonomy once against current main, then layer #176's UI/request flow on that exact contract. Resolve the shared `entry-card.tsx` edits explicitly.
3. Reconcile #173's SEO routes/gate against the actual current route tree and sitemap handlers. Ensure page metadata and sitemap enumeration call the same gate.
4. Run Verify on the final reconciled head and capture the exact SHA. Then perform manual responsive/accessibility QA. No old-head check substitutes for either step.
5. Keep #175 staging-only until real source rights, provenance, hierarchy, coordinates/timezone, and human review exist for each proposed place. Australia stays unpopulated and is not advertised as covered until those records are approved.

## Explicit non-claims

This audit does not prove deployed routes, live database/RLS safety, live sitemap responses, production inventory, Australian coverage, or browser/screen-reader conformance. It creates no records and makes no production changes.


---

## Afternoon re-audit — current main and active integration branches

**Snapshot checked 2026-10-20 afternoon UTC:** current `main` is `14e409e90a027305902f381de3d0a9fbd912dc71`, not the original `9269dff...` snapshot above. The following section supersedes earlier PR-state descriptions where they differ. GitHub source/metadata/workflow reads only; no local checkout, production database, deployed-page, or browser/screen-reader inspection was available.

### Current-main foundation

- `src/lib/supply-engine.ts` still owns `findSupply()`. `src/lib/grounded-matching.ts` is now on main and `doSomethingToday` in `src/lib/intents.ts` calls `groundedMatch` / `queryFromIntent`. This is an evidence-backed consumer path; do not promote it to a second canonical supply engine.
- The newer Grok/Lovable home/front-door changes are on main. The previous PR #177 visual branch and follow-up #191/#192 branches were closed without merging because the implementation was superseded; do not re-open or merge those old visual snapshots.
- Current `src/components/entry-card.tsx` still has a native `<button>` around block-level card content. Current focused fix is #193, based on current main.
- Current main does **not** yet contain the service-locality SEO gate modules or the generic `/$country/$place/$service` route. These remain in #173's older, integrated branch.
- Current main's `docs/agents/STATUS.md` still references #177 as the active design PR and lists #186/#187/#190 as current work. That status is stale and should be reconciled after the current contract integration and accessibility decisions.

### Current integration queue and evidence

| PR | Observed status | Readiness interpretation |
|---|---|---|
| [#193 — EntryCard accessibility](https://github.com/mattleask373-rgb/life-lived-network/pull/193) | Open draft, current-main base `14e409e...`; latest change is an empty native full-card button over a semantic article. Previous hosted Verify passed before that latest change; a fresh run is required. | Best current focused accessibility fix. Manual 375px/1280px, keyboard and screen-reader checks still block calling it complete. |
| [#195 — detail sheet and map controls](https://github.com/mattleask373-rgb/life-lived-network/pull/195) | Open draft on current main; hosted Verify #39439225424 passed on recorded head `6624f789...`. | Useful current design work, but manual responsive, keyboard, screen-reader, focus-return and contrast checks remain. Verify does not equal manual QA. |
| [#196 — Grok integration playbook](https://github.com/mattleask373-rgb/life-lived-network/pull/196) | Open draft, docs-only, current-main base. | Useful release/coordination guide; owner review still needed. |
| [#197 — work contract + Adzuna staging](https://github.com/mattleask373-rgb/life-lived-network/pull/197) | Open draft, current-main base; mergeable; hosted Verify #39439428714 passed on exact head `1abc21d...`. | Preferred current-main successor to the stale #174 plus #187/#190 work. Contract, taxonomy and fixture-first staging are present, but all Adzuna candidates remain review-required, `canPublish: false`, with no live requests or credentials. Human source/legal/retention/market review still blocks activation. |
| [#173 — SEO gate, locality/service pages and sitemaps](https://github.com/mattleask373-rgb/life-lived-network/pull/173) | Open, non-mergeable, old-base integrated branch; latest recorded head `94870d5...`; hosted Verify #39427722990 passed on that recorded head. It now includes work-opportunity files from the contract/surface branches as well as SEO files. | Do not treat this as a small isolated SEO PR. Reconcile against current main and the eventual #197/#176 integration, preserve generated route-tree correctness, and run Verify on the final candidate. The sitemap builder is bounded and fails closed on incomplete scans; verify that the data slice used by the sitemap matches the rendered route's exact 60-entry scope and ordering before launch. |
| [#174 — work contract/taxonomy](https://github.com/mattleask373-rgb/life-lived-network/pull/174) | Open, old-base/non-mergeable. | Superseded as the preferred current-main integration path by #197; do not independently merge the old branch if #197 is selected. |
| [#176 — opportunity surfaces](https://github.com/mattleask373-rgb/life-lived-network/pull/176) | Open, old-base/non-mergeable; hosted Verify passed on its recorded head. | Reconcile only after #197's contract lands; it changes public locality/service/need surfaces and carries contract copies. Avoid duplicate definitions or branch merges. |
| [#175 — place staging validator](https://github.com/mattleask373-rgb/life-lived-network/pull/175) | Open, old-base/non-mergeable; hosted Verify #39427760586 passed on recorded head `bc4119e...`. | Staging only. Proposed Australian hierarchy and Queensland gazetteer point candidates remain unapproved, `not_published`, with rights review pending; Byron Bay and parent coordinate questions remain unresolved. |
| [#186 — Adzuna parser](https://github.com/mattleask373-rgb/life-lived-network/pull/186) | Open draft, old-base; hosted Verify passed on its recorded head. | Parser code is carried forward into #197. Avoid duplicate integration/activation from this branch. |
| [#188 — need prefill CTA](https://github.com/mattleask373-rgb/life-lived-network/pull/188) | Open draft, based on #176's old branch. | Keep as a reference for bounded prefill behavior; reconcile after contract/surface changes on current main. Prefill is not contact and does not mean a host was messaged. |
| [#178 — this audit](https://github.com/mattleask373-rgb/life-lived-network/pull/178) | Open draft, docs-only, old-base but currently mergeable. | Keep this updated with the current snapshot; do not use old SHAs above as current truth. |

### New integration risks and release blockers

1. **Branch overlap:** #173 currently contains both SEO work and opportunity files. #197 is the clean current-main contract/staging successor. Integration should be deliberate, not a blanket merge of #173 followed by #174/#176.
2. **Sitemap/page parity:** both `/sitemap.xml` and `/api/public/sitemap-pages.xml` call the same dynamic candidate adapter in #173, and the candidate helper uses the same indexability decisions. Before launch, verify route-loader and sitemap data-window/order equivalence, that unknown place/service slugs return 404, and that current deployment serves the new route handlers.
3. **EntryCard semantics:** #193's latest intended pattern is a semantic article plus a separate labelled native action button, not a button wrapping the article content. The new code-bearing head needs fresh Verify and manual QA; a source-regex test alone cannot prove screen-reader behavior or 375px layout.
4. **No live job supply:** #197's Adzuna parser/staging bridge is fixture-first and intentionally cannot publish. No credentials, feed calls, live records, or Australian inventory are enabled by these PRs.
5. **No release claim yet:** there is no evidence here of live sitemap fetches, search-console/index coverage, a production two-account RLS proof for this new work path, signed-out enquiry submission, or a completed mobile/keyboard/screen-reader pass.

### Recommended next sequence

1. Complete fresh Verify plus manual QA for #193; keep it draft until manual checks are recorded.
2. Human-review and decide whether #197's contract/staging scope is acceptable; it is the current-main base for work integration, not permission to activate Adzuna.
3. Reconcile #176's presentation/request path onto the post-#197 main, with explicit regression tests that the request CTA uses `/need` and the canonical `findSupply()` flow and never claims outbound contact.
4. Reconcile #173's SEO gate/routes/sitemaps last, minimizing its diff to the SEO dependency once the work contract/surface integration is stable. Run Verify on the exact final head.
5. Keep #175 staging-only until source rights, hierarchy, coordinates, timezone semantics and pilot scope receive explicit human approval.
6. Update `docs/agents/STATUS.md` and `roadmap.md` to stop listing closed #177 as active, and record exact current heads and manual blockers.

**No merge, deploy, schema/RLS/grant change, credential activation, production write, or live-feed action was performed by this audit.**
