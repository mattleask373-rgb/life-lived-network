# Phase 2 — Global Traveller + Local Life Network: 24-Hour Master Plan

**Planning window:** 20 October 2026, 14:20 UTC+01:00 → 21 October 2026, 14:20 UTC+01:00  
**Canonical repository:** `mattleask373-rgb/life-lived-network`  
**Baseline:** `main` at `9269dff0fb66911733ea309fd7342d86bb60c112` when this plan was opened. Recheck main before every integration.  
**Status:** Execution plan; no feature merge, deployment, production write, partner activation, or pilot launch is authorised by this document.

## Mission

Deliver one coherent, trustworthy global network for travellers and locals: discover a place, find real people/services/opportunities/events, participate in local life, offer skills, and make a safe, user-directed enquiry. Support any country through data and explicit publication gates—not country-specific code. A beautiful interface must make the real product clearer, not make absent inventory look present.

Examples that should fit the same architecture:
- **Asia:** “Get a guide” or a local-led experience in a chosen place, with language, price, dates, source and booking/enquiry state shown only when explicitly supplied and approved.
- **South America:** language teaching and language exchange, with declared language/level/format, location or remote status, availability only when explicitly published, and paid/unpaid status kept distinct.
- **Everywhere:** cleaning, gardening, hospitality shifts, event work, seasonal work, odd jobs, professional services, community activities, tours and dated events—using the same taxonomy, canonical place hierarchy, publication controls and `findSupply()` path.
- **Locals as first-class users:** offer a skill, find local services, join community activities, host/teach/guide where appropriate, or look for paid work. Do not frame the product as tourism-only.

## Architecture decisions that are not up for re-litigation

1. **One source of truth:** this repository only. No fork or “life-lived-network2”.
2. **One discovery authority:** `src/lib/supply-engine.ts` / `findSupply()`. Do not add a second matcher, ranker or parallel discovery graph.
3. **Truthful supply:** no fabricated listings, people, events, availability, pay, credentials, reviews, local facts or booking claims. Empty states explain what is and is not known.
4. **Explicit provenance and permissions:** rights, attribution, freshness, visibility, publication and human policy review are required before public/indexable use.
5. **SEO is a quality gate, not a content factory:** the same explainable decision governs page metadata and sitemap membership. Demo records never index.
6. **No autonomous merge or deploy:** focused branch + PR, exact-head hosted Verify, independent human review. No schema/RLS/grant edits, production writes, secret injection, live feeds or external side-effects without explicit approval and required proof.
7. **Human gates stay human:** legal/pay/volunteer policy, safety boundaries, production authority, irreversible semantics, partner terms, real inventory approval and launch go/no-go.

## Evidence snapshot and dependencies to preserve

- `main` baseline above is still the only integration base unless a human-approved merge changes it.
- **#177 — visual foundation / accessibility:** open. Manrope and warm paper/forest design tokens, source-backed imagery and clearer place picker. Its current PR says manual 375px/desktop, keyboard and screen-reader QA is still required. Do not duplicate its `EntryCard`/detail work; obtain the human pass first.
- **#174 — work opportunity contract/taxonomy:** open, current PR description reports exact-head hosted Verify passed. It is the contract dependency for work surfaces.
- **#176 — opportunity surfaces:** open, depends on #174 and uses existing locality/category routes. It intentionally does not send an enquiry or create a second matcher.
- **#173 — SEO slice 3:** open, reports a pure explainable indexability gate, gated locality/service sitemap candidates and BreadcrumbList. It must be reviewed after #174 and #176; verify exact head and sitemap/metadata symmetry. Event and provider detail routes/full sitemaps and a real frictionless enquiry transaction remain gaps.
- **#175 — Australia staging:** open, non-destructive proposed hierarchy/validator only. Rows remain not published; coordinates/licence/hierarchy/timezone semantics still require review. Australia is **NOT LIVE**.
- **#178 / #179 — audit + market onboarding:** open documentation PRs; review for integration findings and country-neutral launch gates. Do not assume either has merged.
- The older SEO plan describes slice 4 provider profiles, slice 5 structured data/sitemaps, slice 6 enquiries and slice 7 navigation/analytics. Treat these as roadmap, not as completed functionality unless the current tree and tests prove it.

Re-fetch each PR and its exact-head Verify status before relying on the snapshot. Mergeability metadata is not approval.

## The 24-hour operating schedule

### T+0–2h — Control tower and integration truth

**Lead architect + integration reviewer**
- Confirm canonical repo, `main` SHA, open PR heads, dependency graph, latest hosted Verify results and changed-file overlaps.
- Publish a concise dependency ledger: #177 manual QA → #174 contract → #176 surfaces → #173 SEO final integration. Keep #175 staging isolated. Review #178/#179 docs as non-blocking inputs.
- Identify all shared-file conflicts before anyone edits; assign a single owner per shared component.
- Capture a “known real vs absent” inventory table by market and data source. No inventory is inferred from mockups or demo fixtures.
- Ask the human owner to complete #177 manual responsive/keyboard/screen-reader review and choose the first public pilot locality. Do not block independent docs/tests/design specification on that decision.

**Exit:** exact SHA and CI evidence recorded; owners and dependency order are explicit; no duplicate implementation is in flight.

### T+2–6h — One product model and global design system

**Grok / design lead (design + app-shell lane)**
- Inspect the current app and Grok’s latest design artefacts before changing anything. Keep the successful visual language; do not replace the application with a mock prototype.
- Produce a compact design-system spec: typography, color/surface tokens, spacing, cards, chips, forms, empty/loading/error states, responsive breakpoints, touch targets, focus and reduced-motion behaviour.
- Define the top-level user intent model: **Discover**, **Offer**, **Find work**, **Community**, **My journey** (labels can be tested; avoid forcing tourism framing).
- Design a single “place front door” that connects local services, people/capabilities, events, guides/tours, work opportunities, community contributions and travel corridors. Render only categories with real eligible data; show honest empty states for the rest.
- Make traveller/local roles contextual modes, not separate siloed products or duplicate accounts. One person may be both host and traveller.

**Product/architecture lane**
- Map each intent to existing canonical models and routes. Document gaps rather than inventing schema or fake endpoints.
- For each card/detail, specify source, last-updated/freshness, verification state, price/compensation basis, booking/enquiry action and what that action actually does.
- Produce mobile-first wireframes for home/discovery, locality, service/category, opportunity detail, event/tour detail and profile/trust surfaces. Mark data-dependent modules explicitly.

**Exit:** reviewed design spec and route/data mapping; no mock content mistaken for production inventory.

### T+6–12h — Highest-leverage implementation, split into non-overlapping PRs

**Lane A — SEO + discovery integration**
- Human-review #174, then #176, then #173 in dependency order; do not merge automatically.
- Confirm server-rendered locality/service content, canonical URLs, crawlable internal links, breadcrumbs, and quiet states.
- Test all four gate outcomes and reasons: `INDEXABLE`, `INDEXABLE_WITH_LIMITATIONS`, `NOINDEX`, `NOT_PUBLISHED`.
- Verify page metadata and every sitemap builder use the same policy; demonstrate that empty, demo-only, stale, private, unlicensed, unreviewed or policy-blocked records cannot enter sitemaps.
- Do not claim Search Console, deployed crawl, full event/provider sitemap or organic conversion results without evidence.

**Lane B — Place fabric / Australia staging**
- Review #175’s proposed Australia → state/territory → locality hierarchy and staging validator.
- Check country code, parent/child links, unique slugs, currency AUD, IANA timezone, coordinate meaning/CRS, source version, attribution/licence and publication state. Use approximate public locality coordinates only; never home-address coordinates.
- Add no live rows and do not silently fill unknown parent coordinates/timezones. Keep every proposed row `not_published` until a human approves evidence.
- Run only non-writing validation; record exact rejected rows and reasons.

**Lane C — Traveller/local opportunity taxonomy**
- Use #174’s explicit contract for paid, unpaid and not-stated engagement; no inference from wording.
- Validate category coverage for guide/local host, language teaching/exchange, cleaning, gardening, hospitality, event shifts, seasonal and odd jobs, professional jobs and community contributions.
- Check pay uses integer minor units + explicit currency + basis; dates, duration, accommodation, transport, skills, expectations, conditions, jurisdiction, source/rights and review status remain explicit.
- Ensure #176 surfaces eligible records via existing category/locality routes and `findSupply()`; do not add a road-trip-specific matcher. Corridor views are a presentation of canonical results, not another engine.
- Keep partner ingest as a disabled, provider-neutral contract until rights, credentials, rate limits, provenance, retention, failure behaviour and owner approval exist.

**Lane D — Events, guides and language learning**
- Audit existing event/service/activity models and routes. Separate “tour operator/service” from “dated event”; do not force both into the same structured data type.
- Specify minimum event fields (real source, start/end instant or explicit date semantics, timezone, venue/place, rights, freshness, cancellation/status, public booking/source URL) and guide/language-offer fields (provider, languages, format, location/remote, terms, price basis, dates/availability if known, source and publication review).
- Add only tests, taxonomy mapping or documentation that fit existing contracts. New public route/schema work needs a separate focused PR and review.
- Do not activate Ticketmaster or any external feed; record the exact owner decision and credential boundary.

**Lane E — Enquiry and trust**
- Trace the actual signed-out → locality/service → real record → trust context → user-directed enquiry path.
- Clearly distinguish a prefilled need from a sent message, submitted enquiry or confirmed booking. Never imply a side effect that did not occur.
- Audit current report/block/moderation ownership, contact and account deletion paths, rate-limit/error states and privacy-safe analytics. Document gaps; no schema/RLS changes or contact-side effects without explicit human approval and disposable-database proof.

**Exit:** each implementation lane has a focused PR or a documented blocker; shared files have a single owner; no lane bypasses another’s gate.

### T+12–18h — Integration review and proof

- Reconcile feature branches using merge commits or new follow-up commits; do not rewrite published history, force-push or squash/amend pushed commits.
- For each PR, record purpose, non-goals, files, exact base/head SHA, local test evidence if genuinely run, hosted Verify link for exact head, launch-gate impact, known gaps and human decisions.
- Run the repository’s documented verification suite in an actual local environment where available (typecheck/tsgo, lint, Vitest, production build). If only GitHub-connected tools are available, state **local tests not run** and use hosted Verify; never imply otherwise.
- Add regressions for: unknown vs absent; demo exclusion; rights/policy/freshness gating; taxonomy not being qualification; paid/unpaid/not-stated distinction; parent/child locality; empty and failed reads; sitemap/gate parity; visible-data-only structured data; no accidental contact side effect.
- Manual test at 375px and desktop, keyboard-only, visible focus, screen-reader labels, contrast, 44px targets, image alt/credit/fallback, reduced motion and loading/error/empty states. Grok’s #177 review must not be replaced by automated checks alone.

**Exit:** exact-head CI is green or clearly blocked; all manual checks are recorded as passed/not run; PRs remain unmerged pending human review.

### T+18–24h — One integrated product handoff

- Publish the updated journey map and a short “what works now / what is planned / what is blocked” feature matrix.
- Deliver a launch readiness matrix for the 31 October gates: SEO, indexability/sitemaps, AU place hierarchy, opportunity taxonomy/surfaces, events/guides/language services, enquiry, safety/ops, accessibility/mobile, partner readiness and real inventory.
- For each row record evidence URL, owner, status (**PASS / BLOCKED / NOT STARTED**), and next action. No vague “done” status.
- Create the next implementation PRs only where dependencies and existing models support them. Keep the broader app redesign incremental and reversible.
- Ask the owner for explicit decisions on pilot locality, approved real-inventory/source owner, jurisdictional work/volunteer policy, enquiry data/consent model, and whether/when any partner feed is authorised.

**Exit:** founder can make a go/no-go decision from evidence, not screenshots or optimistic claims.

## Product experience acceptance criteria

1. **One coherent shell:** consistent navigation, typography, colors, forms, cards and trust language across web/mobile; no parallel prototype app.
2. **Dual-sided value:** every place can help a visitor discover local life and help residents offer/find services, work, learning and community—without implying that every category is populated.
3. **Place as context:** parent/child navigation, currency and local time are data-driven; unknown values remain unknown.
4. **Useful result cards:** real title/category, place, explicit terms, source/provenance, freshness and clear state; photos only with display rights and attribution.
5. **Action truthfulness:** enquiry, booking, external link and prefilled need are labelled by their actual behaviour; errors and retry states are clear.
6. **Trust and safety:** public/private boundaries, report/block, moderation escalation, qualification evidence and pay/volunteer distinctions are not hidden by visual polish.
7. **SEO quality:** server-rendered unique useful content, canonical URL, internal links, breadcrumb, same indexability gate for metadata and sitemaps, no fabricated structured data.
8. **Accessibility/performance:** keyboard and screen-reader usable, responsive at 375px, touch targets ≥44px, meaningful alt text, reduced motion, no essential content dependent on client-only rendering.
9. **International readiness:** no country-specific branching for ordinary place/category support; locale, currency minor units, date semantics, timezone/DST, languages and jurisdictional policy are explicit.
10. **Real-world proof:** a human-operated pilot test with a real, rights-cleared record or explicitly labelled non-public demo; record the complete outcome and consent. No fake public inventory to make the screen look full.

## Explicitly out of scope for these 24 hours

- Autonomous merge/deploy or changes to branch protection.
- Schema, RLS, grants, production writes, exact-location changes, secrets, external credentials or live partner feeds.
- Fabricated users, listings, reviews, events, availability, jobs, pay, guide credentials or local knowledge.
- A full replacement app, a second discovery/matching engine, AI-generated SEO landing pages, payments, unapproved messaging or booking automation.
- Declaring Australia or any market live before real supply and human gates pass.

## Required PR / handoff template

- **Purpose / non-goals**
- **Canonical base SHA and exact head SHA**
- **Files changed and dependency PRs**
- **Verification:** local commands actually run; hosted Verify URL for exact head; manual QA status
- **Truth/safety checks:** demo exclusion, rights/provenance, privacy, no side effects
- **31 October gate impact**
- **Remaining gaps / owner decisions**
- **Updated `docs/agents/STATUS.md`, `roadmap.md` and relevant launch docs**

## Human decisions needed

1. Which locality is the first **actual** pilot (Byron Bay, Agnes Water, Port Douglas, or another owner-approved locality)?
2. Who owns and approves the first real, rights-cleared inventory and moderation/on-call responsibilities?
3. What jurisdiction-specific paid-work/volunteer rules and regulated-service gates must be approved before publication?
4. Is a signed-out enquiry with explicit consent approved as a product direction? Any persistence/schema/RLS change still requires separate approval and proof.
5. Is a Ticketmaster or alternative event/partner integration approved, and who owns terms, keys and ongoing data rights?

**Definition of success at T+24h:** a verified dependency ledger; coherent reviewed design spec; focused implementation PRs with exact-head evidence or explicit blockers; documented real-user journey; no unsafe shortcuts; and a human-readable launch gate matrix. Success is not measured by number of mock screens or commits.
