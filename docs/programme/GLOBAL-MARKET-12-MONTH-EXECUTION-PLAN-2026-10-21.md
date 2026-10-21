# Real World Atlas — Audited 12-Month Global Product & Engineering Plan
## Grok execution brief: research → integration → pilot markets → repeatable global launch

**Audit date:** 21 October 2026  
**Planning horizon:** 12 months from owner acceptance; treat dates as a rolling horizon, not a guarantee of completion.  
**Product:** Real World Atlas / Life Lived Network (the canonical product name still requires an owner decision if branding differs across surfaces).  
**Repository:** `mattleask373-rgb/life-lived-network`  
**Purpose:** Give Grok one evidence-bounded, implementation-oriented plan that turns the existing application and its open development queue into a safe, useful, measurable platform for discovering and coordinating real-world life: local services, work, learning, travel, culture, community, events, and human connection.

> **North star: optimise for “life lived”, not screen time.** A session that helps somebody find a trustworthy cleaner, learn Spanish with a local teacher, meet a guide, join an event, complete a useful project, or safely connect with a neighbour can end with the person closing the app. That is success. Do not build an addictive feed or optimise vanity engagement.

---

## 1. Executive mandate

Grok is to act as the lead implementation partner across product research, frontend, backend integration, testing, security, data quality, SEO, localisation, observability, and launch operations. Do not start by rewriting the stack or building a parallel product. Preserve the existing canonical architecture and integrate it in small, reviewable increments.

The intended outcome at the end of the first year is **a production-ready, repeatable market-launch system with one or more evidence-backed local pilots**, not a claim that every category is available in every country or that global scale has already been achieved. Worldwide reach is the product direction; launch sequence must follow genuine supply, legal readiness, language coverage, support capacity, and demonstrated customer value.

Research is continuous, but implementation must be prioritised by the next verified constraint. For each work item, identify: evidence; hypothesis; user impact; risk; dependencies; smallest useful change; acceptance tests; rollback; and human gates. Prefer one complete, reliable vertical slice over many impressive but disconnected screens.

### The main product jobs

1. Help people find and use real local services, such as “cleaner in my area” in locations with high short-term-rental/property turnover.
2. Bring visitors and residents together around local guides, experiences, language learning (including learning Spanish with locals in South America), culture, food, nature, music, workshops, and events.
3. Help people discover real work and earning opportunities, exchange skills, offer help, volunteer, join projects, and meet genuine needs.
4. Make the local world legible through place pages, map/list exploration, journeys, and useful cross-navigation.
5. Build trust in a human network through clear provenance, consent, availability, moderation, safe introductions, and honest unknown/empty states.
6. Grow organic discovery with technically correct, evidence-gated search landing pages rather than mass-produced thin pages.
7. Give operators a secure, measurable system for maintaining supply, freshness, support, reliability, and a governed AI-assisted development process.

---

## 2. Audit method and evidence boundary

This is a repository-and-PR audit based on the current GitHub files and metadata available on 21 October 2026, including `README.md`, `roadmap.md`, `docs/programme/MASTER-PROGRAMME-SPECIFICATION.md`, `docs/agents/README.md`, `docs/agents/STATUS.md`, `docs/agents/OBSERVABILITY.md`, and the open implementation PRs referenced below. It is not a production penetration test, a direct Supabase configuration inspection, a complete crawl of the live site, a commercial market study, or a load test.

**Do not treat previous status notes as automatically current.** The status document and baseline PR disagree on the observed main SHA and branch-protection state. The baseline document in PR #254 records `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` and an active ruleset; `docs/agents/STATUS.md` reports `8d79247991187bf64813cf72e3ec75aeb508e2e9` and says enforcement is disabled. Those statements cannot both describe the same point in time. Grok must re-read the actual current main ref and verify ruleset/required checks through authoritative repository settings before relying on either statement.

The repository-wide PR search returned **99 open pull requests** at the time of this audit. The earlier #254 baseline counted 93 before that PR and later work was opened. These numbers are point-in-time queue evidence, not a stable status. Some PRs are stacked, competing, stale, or historical; a green run on an old branch is not proof that it can merge cleanly now.

The live Lovable origin and the production Supabase project/settings have not been independently proven here. Lack of access by a tool is not evidence that a service is down. Production availability, public sitemap behavior, real provider density, RLS effectiveness, database grants, backup restoration, DAU, revenue, retention, latency, and infrastructure cost remain **unknown until measured**.

---

## 3. Current-state audit: keep what exists, complete what is missing

### 3.1 Foundations described by the repository

The repository and programme documents describe substantial existing foundations:

- TypeScript, React, TanStack Start/Router, Supabase/Postgres/Auth/RLS, Bun, Vitest, ESLint, and a production build pipeline. Preserve this stack unless an evidence-backed ADR proves a limiting constraint.
- Canonical place hierarchy and locality routes, including a UK/Ireland geography foundation. The roadmap reports 221 UK localities and keeps Portugal/Lisbon as non-default geography. This does not prove global geographic coverage.
- Shared service taxonomy and generic locality/service-locality routes, with public/private metadata helpers and honest empty states.
- One canonical possibility/discovery authority: `findSupply()` in `src/lib/supply-engine.ts`; evidence-based matching is implemented through `src/lib/grounded-matching.ts`. Do not introduce a parallel matcher, ranker, or search result truth engine.
- Public listing retrieval/normalisation, an ingestion boundary, event/source contracts, provenance/freshness concepts, work-opportunity contracts, and fixture-first provider adapters.
- Human connection/need flows, account/private features, private place memories, and reported data-export functionality.
- Map/list exploration, Journey, Road Trip, place selection, and a visual redesign in development/integration branches.
- A signed-in, schema-bounded draft-assistance helper that does not save automatically.
- A policy scaffold for “Ask this place”, but **no verified, active, public LLM endpoint**. The placeholder is unavailable/disabled and makes no model call.
- Technical SEO utilities for canonicals, public/private metadata, sitemap construction, and route privacy. The full shared, explainable indexability-to-sitemap chain and live-host validation are still integration work.
- A repository-resident agent control-plane philosophy, task contracts, handoffs, invariants, autonomy levels, and metrics vocabulary. These documents do not by themselves prove a durable, always-on executor is running.

Grok must verify every item against current main before implementation. Treat the list as the starting hypothesis supported by repository notes, not blanket proof that every flow works in production.

### 3.2 Current PR queue and integration risks

At minimum, reconcile these open candidates and their dependencies before writing overlapping code:

| Area | Known candidate(s) | Required treatment |
|---|---|---|
| One-year Grok operating prompt | PR #248 | Existing 867-line rolling operating brief; do not duplicate or silently replace it. Reconcile this implementation roadmap with that prompt. It is a draft and does not itself configure Grok, credentials, a scheduler, or autonomous execution. |
| Audited scale baseline | PR #254 | Evidence-bounded baseline. Refresh the main SHA, PR queue count and branch-protection evidence before treating snapshot figures as current. |
| Map viewport and locality scope | PR #242, stacked PR #261; PR #238 also exists | Resolve dependency and overlap. Review error/cached-refresh behavior, row pagination/truncation, request cancellation, too-wide view state, antimeridian behavior, and map/list agreement. Require manual browser/accessibility evidence. |
| Shared SEO indexability and sitemaps | PRs #247, #249, #252, #251, #253, #257 | Choose a single canonical eligibility rule shared by route metadata and sitemap enumeration. Review the non-paginated place query risk in #249; a hard cap is not safe if the upstream API silently truncates below it. Validate live hosting, robots, canonical metadata, sitemap index, child sitemaps, private routes, and duplicate/conflicting paths. Keep `/life-list` private/noindex. |
| Security automation and dependencies | PR #260 | Has reported CodeQL and locked dependency-audit success on its branch after addressing 12 advisories (1 critical, 11 high). It remains unmerged; verify exact current head, package/runtime compatibility (including Bun lockfile format), least-privilege workflow permissions and the actual main settings before accepting. Static analysis is not a production penetration test. |
| Work-opportunity contract and staging | PRs #241, #244, #259 and older/stacked opportunity PRs | Select one current-main contract → staging → review/publication chain. Preserve provenance, compensation/currency, location, dates, policy/review state, freshness and idempotency. Do not activate a provider feed merely because a parser exists. |
| Ask-this-place policy | PR #245 and related #233 | Review and integrate the fail-closed eligibility boundary only after exact-head checks. The UI must stay disabled until endpoint, retrieval, source rights, citations, abuse controls, evaluation and cost controls are independently accepted. |
| UI redesign and accessibility | PR #211, #220, #231 and adjacent branches | Consolidate the Grok-inspired frontend without losing the canonical data flow. Manual keyboard, screen-reader, responsive, reduced-motion, contrast and focus behavior are required; source photos/fonts must have suitable rights. |
| Main governance and environment | `docs/agents/STATUS.md`, `docs/agents/README.md`, project settings | Resolve contradictory main/protection notes, verify the Lovable Git sync target and production Supabase project, and prevent direct-to-main changes. Never restore a tracked `.env` or copy secrets into docs/branches. |

This table is not a declaration that each PR is mergeable or correctly based. For each, fetch live metadata, base/head SHAs, diff, check runs, reviews, comments, changed paths, and dependencies. Label it: **integrate**, **rebase/rebuild as a fresh branch**, **superseded**, **blocked**, or **close after preserving unique work**. Never merge a stale or stacked branch independently.

### 3.3 Launch blockers that must remain visible

1. **Governance/source of truth:** current main SHA, required checks, review enforcement, Lovable sync branch, deployed origin and backend project are not yet reconciled in one verified status record.
2. **Security/access control:** end-to-end RLS/grants/exposed-schema and storage policy evidence is incomplete in the historical audit. Public paths with admin-client reads require careful field-level review. No grant/RLS/schema widening without a reviewed matrix and disposable-environment evidence.
3. **Real supply:** the roadmap identifies demonstration fixtures, a Ticketmaster key and genuine organisation details as outstanding for some experiences; Adzuna work has been fixture/staging-first. Demo records cannot prove real market coverage or be indexed as real inventory.
4. **SEO deployment:** repository code is not evidence that the live host serves the intended `robots.txt`, sitemap, status codes, canonicals, or SSR HTML. Verify on the published origin after an authorised release.
5. **AI assistant:** no public assistant is proven active. Read-only retrieval with citation and strict eligibility must precede public use.
6. **Always-on autonomy:** existing sentinel/control-plane proposals are not proof of a durable, supervised 24/7 executor. Do not claim always-on execution before demonstrating queue persistence, leases/heartbeats, budget guard, cancellation, escalation, audit logs, and kill switch.
7. **Marketplace trust/conversion:** real provider messaging, booking, payments, verified availability, dispute handling, and revenue operations must not be implied when absent.
8. **Scale evidence:** real baseline traffic, query volume, latency, retention, geographic data density, support load and unit economics are not yet known.

---

## 4. Product scope: connect daily life rather than become a thin listing directory

Treat the following as a **capability map**, not a requirement to launch every vertical simultaneously. Reuse canonical place, service, listing, needs, opportunity, event, provenance, and connection contracts; create a new domain model only after documenting why existing contracts cannot represent the facts safely.

### A. Home and local services
Cleaning (including short-term rental turnover), gardening, repairs/maintenance, moving help, local business support, tutoring, pet or childcare services only after policy and trust research, and other genuine local services. A service record must distinguish provider identity, declared service area, stated skills/qualifications, price basis, date/time availability, response status, and evidence. **Living in a place does not mean serving it; capability is not availability; unknown is not yes.**

Example journey: “cleaner in my area” → choose/confirm location (manual entry must remain available when location permission is denied) → narrow to a usable neighbourhood radius → see real current providers and their stated coverage → compare transparent facts → send a consented request/quote → see an honest sent/received/failed state → report a problem or withdraw. Do not claim booking, response, background checks, insurance, reviews, or a confirmed slot unless the backend actually establishes it.

### B. Travel, local guides and experiences
Local guides, city walks, cooking, surfing, hikes, cultural visits, workshops, food, nature, arts, venues, and small group experiences. Compare the value proposition with existing travel/experience marketplaces (including GetYourGuide) through research; do not scrape their restricted content, copy their catalogue, or misrepresent affiliation. Start with opt-in local operators and first-party evidence.

### C. Language learning and cultural exchange
For “learn Spanish in South America”, explore language tutors, conversation partners, cultural exchanges, local classes, language cafés, and small experiences. Research which city/neighbourhood has both visitor demand and consenting, genuine local supply before selecting a pilot. Represent teaching language, learner language, skill level only when stated, lesson format, duration, price/currency, meeting mode, safety expectations, calendar/time zone, cancellation terms, and source. Do not imply a person is a qualified teacher unless credentials are supplied and verified under an agreed policy. Keep public contact details private by default.

### D. Work, earning and opportunity
Local gigs, hospitality/seasonal jobs, home-service work, event work, creative work, skill-based opportunities, volunteering, and training. Separate paid work, volunteering, unpaid training, expenses, stipends and unknown compensation. Publish only opportunities with the required source, current status, location, terms, expiry, and review/policy eligibility. Never infer salary, legal work eligibility, accommodation, or qualifications.

### E. People, needs, offers and skill exchange
Help people find support, offer time or capability, request help, share explicitly opted-in journeys, connect around a project, exchange skills and build community. Protect identity and precise location. Use the canonical `findSupply()` and existing `SupplyResult`/possibility contract as the discovery authority. The UI may present its evidence and actions but must not invent matches, reasons, availability or contact methods.

### F. Events, music, artists, venues, culture and nature
Use provider-neutral source adapters, date/time-zone correctness, rights/attribution, deduplication, cancellations, freshness and truthful “not configured” states. Do not turn fixture/demo events into public real events. The absence of retrieved events is not proof that nothing is happening.

### G. Journeys, map, local navigation and transport
Keep locality selection distinct from transient map viewport. Preserve safe query bounds, cursor/pagination correctness and anti-meridian handling. Do not imply routing time, distance, public transport legs, ride sharing or route optimisation until a real provider/data path supports the claim. A person’s journey does not imply their availability to meet or transport somebody.

### H. Other high-value daily-life categories
Research housing/community resources, local groups, mutual aid, classes, wellbeing activities, civic opportunities and project support as separate policy domains. Do not launch sensitive or regulated verticals simply because they fit a broad vision. For housing, childcare, healthcare, finance, legal advice, regulated employment or identity/safety verification, require jurisdiction-specific research, risk assessment and an explicit owner go/no-go.

---

## 5. Product and technical principles that are not negotiable

- **One source of truth for discovery:** extend `findSupply()`, canonical place/service taxonomies, ingestion contracts, provenance and existing action semantics. No parallel matcher/ranker or raw-LLM matching that bypasses them.
- **Real-world truth:** distinguish published, demonstration, staged, expired, reported, private and unknown records. Every user-visible availability/price/credential/rating/review/booking statement must be traceable to evidence.
- **Consent and privacy by default:** do not expose private contact details or precise live coordinates. Respect block/report, deletion, retention, export, user permissions and jurisdictional rights.
- **Trust before transaction:** use explicit eligibility and moderation for providers, requests, jobs, events and user-submitted records. Define what “verified” means before displaying the label.
- **SEO quality over page volume:** public URLs must use one canonical, explainable indexability decision; low-value, stale, private, demo-only or unsupported pages stay noindex and out of sitemaps. No fabricated LocalBusiness details, reviews, ratings, event facts or provider claims.
- **Accessibility from the first implementation:** target WCAG 2.2 AA as the design/QA standard; keyboard, focus restoration, screen-reader semantics, contrast, 200% zoom, reduced motion and 44×44 CSS-pixel touch-target design are acceptance checks, not polish.
- **Internationalisation is architecture:** use locale-aware strings, date/time, currency, number formats, time zones, country-aware addresses, language preferences, translated route metadata and appropriate canonical/hreflang strategy. Do not hard-code one country/currency as a global default.
- **Server owns privileged decisions:** never trust client filters as an authorisation boundary; never expose service-role credentials to browser code; validate inputs and response size on the server; fail closed when permission, scope, provenance or freshness cannot be verified.
- **Small reversible changes:** feature flags, migrations with expand/contract strategy, backward compatibility, safe rollback, exact-head CI, tests and documented acceptance evidence.
- **No autonomy escalation by convenience:** no autonomous main merge, production deploy, live feed activation, schema/RLS/grant edit, paid spend, mass outreach, or external promise. Require explicit human review.
- **No engagement dark patterns:** the product wins when users reach a worthwhile offline outcome; minimise spam, pressure and empty engagement incentives.

---

## 6. Twelve-month execution roadmap

The periods below are months from owner acceptance. Work may overlap when dependencies are clear, but a milestone cannot be marked complete without its exit evidence. If a gate fails, fix it or explicitly narrow the launch rather than relabel the gate “done.”

### Month 1 — Establish the truth and take control of integration

**Research**
- Run a fresh audit of `main`, all open PRs, relevant issues, exact branch bases, required checks, environment configuration, deployed URLs, current routes, schemas/migrations, source adapters, secrets hygiene and product claims.
- Reconcile the main SHA/ruleset contradiction in `docs/agents/STATUS.md` and PR #254; verify branch protection, required `verify` checks, latest-push review, resolved threads, no bypass, and the actual Lovable repository/branch.
- Inspect current production data through a read-only path with authorised access; create a baseline for genuine records by category/location, freshness, provenance, indexed pages, search console, active users, provider conversion, latency/errors, support volume and costs. Mark unavailable metrics **UNKNOWN**.
- Interview a small sample of users, local service providers/property managers, local guides/teachers and community organisers. Test problem urgency before treating search volume as a business opportunity.

**Implementation**
- Create a dependency graph for current PRs; group related changes into one canonical integration chain and close/supersede duplicate work only after preserving unique fixes.
- Refresh the durable status and launch-blocker register. Establish named human owners for production, security, data stewardship, support and launch.
- Confirm a safe non-production environment, data isolation, backups/restore path, secret handling and rollback procedure before integration work that touches runtime or schema.

**Exit gate**
- One agreed main SHA and repository-settings record; no contradictory baseline status.
- Open PR inventory classified as integrate/rebuild/superseded/blocked with explicit dependencies.
- A measured or clearly “unknown” baseline, launch-blocker register, pilot-selection research plan, and an owner-approved Definition of Done.
- No change to production permissions/data has been made simply to clear the gate.

### Month 2 — Integrate the core experience and remove broken journeys

**Frontend**
- Reconcile the Grok-inspired home, navigation, place picker/search, map/list, locality page, service pages, Journey and Road Trip. Preserve the canonical routes and server data flow.
- Build responsive states for loading, empty, stale cached results, cancellation, failed refresh, broad query, inaccessible location permission, no coordinates, not found and retryable failure.
- Complete keyboard-only flows, focus restore, semantic labels, contrast, reduced-motion behavior, visible focus, 200% zoom and mobile tap targets at 375/390/768/1280/1440 widths.

**Backend**
- Validate every server function’s input shape, auth requirement, result limit, cancellation path, privacy scope and use of anon versus admin clients.
- Review map viewport caps, descendant-place expansion, antimeridian math and pagination. Ensure an oversized locality returns a typed safe error, never an unfiltered query.
- Add end-to-end tests for one published record travelling from allowed read → canonical normalisation → discovery → visible card/detail → user action, alongside private/demo/expired/blocked/empty cases.

**Exit gate**
- One consolidated UI implementation per feature, exact-head CI green, no known high-severity regression, manual accessibility checklist attached, and a traceable core journey that uses genuine test-environment data rather than fixtures presented as real.

### Month 3 — Canonical data contracts and a repeatable market model

**Research/design**
- Define the minimum launch contract for a locality, service/provider, work opportunity, guide/experience, language lesson, event, community need/offer and source.
- Decide the semantics for service area, verification, availability, contact, request status, cancellation, user reports, paid/unpaid compensation, source rights, freshness and expiration.
- Design an approved market registry: country/region/locality hierarchy, languages, currencies, time zones, date/number formats, consent requirements, supported categories, moderation coverage, data stewards and launch blockers.

**Implementation**
- Prefer additive, backward-compatible contract changes. Document ADRs for changes that affect domain semantics or access-control boundaries.
- Make source adapters idempotent, bounded, attributable, deduplicated and freshness-aware; stage unknown payloads for review instead of auto-publishing them.
- Add explicit reason codes for rejected/held records and operational views for stale feeds, parsing errors, duplicated identities and missing rights.
- Build category-level completeness gates so one entity cannot be silently reinterpreted as a different service or qualification.

**Exit gate**
- Versioned contracts and adversarial tests for all launch categories; data steward and policy owner; repeatable market-readiness checklist; import/replay/rollback tests in a disposable environment.

### Month 4 — Pilot vertical 1: real home services and short-term-rental cleaning

**Research**
- Select one pilot city and a small number of neighbourhoods only after comparing demand, short-term-rental/property-turnover evidence, legitimate local data sources, provider willingness, competition, support capacity and applicable laws.
- Validate the workflow with property managers/hosts and cleaners. Determine whether users need a quote, repeat schedule, urgent turnover, linen support, inspection or another concrete job. Do not assume one universal “cleaning” workflow.
- Recruit a target cohort of approximately 15–25 opted-in providers and 5–10 property managers/hosts as a research target, not a claim or hard launch promise. If supply cannot be verified, change the pilot or remain in research.

**Frontend**
- Provide explicit location and service filters, coverage area, provider facts, declared experience, transparent stated price basis, time preferences, current freshness, “request a quote”/enquiry path and safe empty state.
- Show “availability not stated” when unknown. Never imply background checks, licensing, insurance, reviews, on-platform messaging or an accepted booking without evidence.
- Keep private phone/email and exact home location out of public result payloads.

**Backend**
- Define service-request schema/contracts and state transitions only after an approved migration design. Bind every request to authenticated user, provider, area, service, consent, timestamp and auditable status.
- Add RLS test matrix for requester, provider, other authenticated user, anonymous visitor, moderator and privileged worker. Add idempotency, rate limits, spam controls, block/report and deletion/retention behavior.
- For the first pilot, use the simplest safe request mechanism. Do not add payments or automatic booking unless separately approved and end-to-end tested.

**Exit gate**
- Real consented supply; verified request delivery/state; RLS/privacy tests; manual walkthrough by a provider and customer; a dispute/abuse escalation procedure; no unsupported trust claims.

### Month 5 — Pilot vertical 2: local guides, experiences and Spanish learning

**Research**
- Compare candidate South American cities/neighbourhoods using real visitor and resident demand, consented tutors/guide/experience supply, safety, local partnerships, language support, seasonality, competition, local regulations and ability to moderate reports. Select a city from evidence; do not pick one merely because it is famous.
- Interview local language tutors, conversation partners, cultural organisations, guides, learners and visitors. Distinguish paid lessons, informal exchange, tours, classes, and community events so users know what they are booking/requesting.
- Research international competitor/user expectations (including GetYourGuide-like experiences) without copying protected catalogues, branding, pricing data or restricted content.

**Frontend**
- Build structured detail and search for language/guide/experience records: languages taught/spoken, learner intent, format, duration, stated price/currency, meeting arrangement, accessibility, current/next availability only if genuinely provided, local time zone, cancellation terms, source and contact preference.
- Offer local-language and visitor-language surfaces; human-reviewed translations for high-impact safety, payment and cancellation text.
- Provide community-safe onboarding and expectation setting. Do not equate a profile, accent, nationality, residence or self-description with expertise.

**Backend**
- Reuse canonical listing/source/provenance contracts where possible; introduce only the smallest category-specific fields justified by evidence.
- Keep sensitive identity checks, personal contact and precise meeting addresses private. Store consent and visibility choices; apply block/report and moderation.
- Do not create a rating/review system until anti-fraud, moderation, appeal, deletion and display policies exist.

**Exit gate**
- One market chosen from documented research; a real cohort of opted-in local supply; complete Spanish/visitor user journey; tested privacy and reporting; clear distinction between informational listing, enquiry and confirmed booking.

### Month 6 — Trust, requests, communications and operational support

**Research**
- Map harms and failure modes for each live category: scams, fake services/jobs, unsafe meetings, no-shows, harassment, discrimination, misleading prices, stale events, payment disputes and false credentials.
- Decide what “verified” means for each trust level, what evidence is retained, how claims expire, who can appeal, and how quickly reports must be handled.

**Implementation**
- Finish one truthful communication/request flow. Every “sent”, “received”, “accepted”, “declined”, “cancelled”, “failed” or “read” state must correspond to durable backend state; do not show success before persistence is confirmed.
- Implement abuse reports, block/mute, rate limits, anti-enumeration, idempotency keys, notification preferences, consented transactional email/push if providers are approved, delivery failure visibility and operator support tooling.
- Document privacy notice, data export/deletion coverage, retention schedule and incident escalation. Keep precise locations and personal contact on a need-to-know basis.
- Create an operator/admin surface for moderation and source-health tasks with strict role checks, audit trail, least privilege and no client-authoritative moderation.

**Exit gate**
- Tested end-to-end state machine; request notification delivery and failure handling; staffed moderation/support owner; response and escalation runbooks; privacy/export/deletion verification.

### Month 7 — Internationalisation and launch-onboarding automation

**Implementation**
- Create a clear locale strategy for language preference, country/market routing, dates, numbers, currencies, time zone display, address structure and language-aware search. Store currency amounts as integer minor units plus ISO currency, not floating-point display values.
- Keep canonical URLs stable per market/language. Implement carefully reviewed translated metadata and correct canonical/hreflang behavior only when translated pages contain equivalent useful content. Do not translate thin pages just to multiply URLs.
- Add locale-aware query synonyms and stop words only through tested dictionaries and observed search failures. Preserve user-language and provider-language evidence separately.
- Build a market launch checklist that covers place hierarchy, local data permissions, source agreements, moderation staffing, support language, legal review, payments if in scope, marketing claims and operational ownership.
- Research applicable privacy, consumer, employment, tourism, tax, safety, accessibility and online-platform rules per chosen jurisdiction with qualified counsel where needed; this plan is not a legal determination.

**Exit gate**
- One additional locale end-to-end in test; no hard-coded formatting in launch journeys; verified fallback language; translation QA and market-readiness checklist approved by a human.

### Month 8 — Supply acquisition and ingestion that can safely expand

**Research**
- Measure supply gaps by locality and category using canonical discovery output and real evidence. A gap means “not found in our current eligible data”, not proof that no provider exists in the world.
- Research lawful directories, public datasets, local councils/organisations, event feeds, business partnerships, and first-party provider acquisition. Record licence/terms, attribution, refresh rate, contact permissions, and removal procedures.
- Prioritise supply partners that can provide current, rights-cleared data and a real point of contact over the largest raw dataset.

**Implementation**
- Complete the current provider-neutral ingest pipeline: source register → bounded adapter → normalise/validate → deduplicate → provenance/freshness → staging → human/policy review → publication. Add replay and rollback.
- Integrate Adzuna/Ticketmaster or other licensed providers only after credentials, account ownership, contract/terms, data fields, attribution, usage limits, security and cost are confirmed by a human. Until then, retain fixture/staging mode and honest “not configured” states.
- Create a first-party provider claim/onboarding flow with email verification, consent, service coverage, categories, terms, update/expiry reminders, report route and proof-based trust labels.
- Implement scheduled refresh only through an approved bounded worker/scheduler, with rate limits, timeouts, retries with jitter, idempotency, dead-letter queue and kill switch.

**Exit gate**
- At least one rights-cleared source or first-party supply workflow operating in staging and then pilot after approval; repeatable import, duplicate controls, freshness monitoring, provider correction/removal, and documented source-rights register.

### Month 9 — Search quality, technical SEO and governed AI

**Search and SEO**
- Reconcile one fail-closed indexability policy across page metadata, canonical generation and sitemap enumeration. The same record/page decision must govern all of them.
- Fix bounded/paginated locality and listing scans so source-side row caps cannot silently truncate global enumerations. Use cursor-safe pagination or database-side aggregation; fail closed when completeness cannot be proved.
- Verify live robots/sitemap/indexes, XML content types, canonical origin, status codes, private path exclusion, child sitemap coverage and published SSR metadata on the real host. A green unit test is not live-host proof.
- Add only evidence-backed structured data (for example breadcrumbs from visible canonical hierarchy); never fabricate reviews, ratings, business attributes, event attendance or LocalBusiness facts.
- Establish privacy-conscious analytics and Search Console/site-map error review where authorised. Track qualified landing-page visits and completed real-world intent, not impressions alone.

**AI**
- Only after the fail-closed “Ask this place” policy and retrieval contract pass review, run a feature-flagged, read-only, place-scoped assistant pilot.
- Retrieve only eligible, current, rights-cleared records; cite sources and timestamps; clearly state what is missing/unknown; enforce context and output limits; resist prompt injection from untrusted listings; rate-limit requests; redact secrets/PII; log minimal operational evidence; cap cost; provide deterministic fallback and kill switch.
- The model may summarise evidence; it may not create supply, infer availability, change records, message users/providers, publish pages, or bypass `findSupply()`. Keep the assistant disabled if any requirement fails.
- Build a fixed evaluation set covering correct citations, stale data, empty results, conflicting sources, malicious listing text, private records, cross-place leakage, language variants, fabricated availability, unsafe requests and cost/latency.

**Exit gate**
- Source pages and sitemaps agree; live endpoints checked; query coverage is complete or fails closed; AI pilot has privacy/security/legal review, evaluation thresholds, budget cap, feature flag and rollback. No assistant is described as live until it is actually deployed and verified.

### Month 10 — Validate commercial model and transactions

**Research**
- Compare revenue models: provider subscription, qualified lead, service fee, booking commission, promoted placement with clear labelling, partner sponsorship, and paid organisational tools. Estimate willingness to pay and support/processing costs with interviews and low-risk experiments.
- The historical €19/month partner price is only a hypothesis in the roadmap; it is not an approved price, customer commitment or proven willingness-to-pay signal.
- Test the marketplace flywheel at small scale: provider activation → qualified request → provider response → completed outcome → repeat use/referral. Do not use paid ranking to undermine trust.

**Implementation**
- Choose one model and one pilot jurisdiction only after an owner decision. Prepare explicit pricing/terms, cancellation/refund/dispute policy, receipts, tax/accounting requirements, customer support ownership, anti-fraud checks and provider payout responsibilities.
- If payments are approved, use a reputable payment provider with a documented security boundary; do not store card data; keep credentials server-side and isolate webhooks with signature verification, idempotency and replay protection.
- Use feature flags and test-mode transactions first. Do not collect money or represent a booking as guaranteed until fulfilment, refunds, failure handling, support and legal obligations are proven.

**Exit gate**
- A validated business-model decision and unit economics worksheet; one legally reviewed experiment; payment tests/ledger reconciliation if applicable; no live charging without explicit human approval.

### Month 11 — Reliability, security, performance and supervised operations

**Engineering**
- Establish pilot SLOs after Month 1 baseline. Proposed initial targets to test, not historical claims: 99.5% monthly availability during controlled pilot; public browse/API p95 under 500 ms at agreed pilot load where technically appropriate; server-error rate under 1%; zero unresolved critical/high security findings at release. Ratify or revise targets based on measurement and business risk.
- Run realistic load/soak and failure tests at a declared workload; include geographic queries, many sparse localities, popular-market hot spots, concurrent searches, cache misses, source refresh, exports, AI usage and provider request bursts.
- Optimise only against traces: SQL indexes/query plans, cursor pagination, bounded batching, cache keys/TTL, CDN/SSR behaviour, connection pool, rate limits, queues and payload sizes. Never remove security checks to improve a chart.
- Verify backups, recovery time, restore drills, alert routes, deployment rollback, dependency provenance, vulnerability triage, secret rotation, least-privilege access, audit-log coverage and data deletion.
- Check Cloudflare/Nitro and Lovable build/runtime compatibility with current Bun/lockfile and deployment settings; a successful GitHub build is necessary but not sufficient.

**24/7 operations**
- First prove a durable scheduler/queue, database-backed job state, atomic leases, bounded heartbeats, attempt limits, cancellation, dead-letter handling, budget accounting, monitoring, stale-worker reclaim, human escalation and operator kill switch in a disposable environment.
- Begin with read-only monitors and low-risk maintenance. Agents can propose tasks, implement on isolated branches and open PRs, but cannot merge to main, change security settings, deploy or make production mutations autonomously.
- Use the existing task/handoff/observability contracts rather than building a competing orchestrator. If the control plane is not proven, call the system scheduled CI/manual execution—not “24/7 autonomous”.

**Exit gate**
- Load/SLO report; security sign-off; restore drill; incident and rollback tabletop; demonstrated queue/heartbeat/kill-switch evidence in staging; monthly cost and AI/provider budget guardrails.

### Month 12 — Launch review, expansion decision and Year Two backlog

**Launch**
- Publish only approved market/category cohorts with rights-cleared live supply, support coverage, working requests and report handling, truthful SEO, localisation, privacy controls, monitoring, rollback, and named operations ownership.
- Use staged rollout: internal/staging → invited provider/customer cohort → constrained public pilot → wider market only after evidence passes. Do not make one worldwide “launch” toggle responsible for multiple untested countries and categories.
- Keep the first markets narrow enough to offer actual value. A user searching for a cleaner should see genuine current providers in the selected area, or an honest quiet state and a meaningful alternative. A visitor looking for Spanish lessons should see actual local offerings with clear language/price/scheduling facts, or be told supply is not yet confirmed.
- Record customer interviews, provider interviews, completed requests, unsuccessful searches, no-response rate, time to first qualified result, repeat use, reports, cancellations, source freshness, SEO quality, latency, incidents and variable cost per successful outcome.
- Conduct a “stop / build / pivot / explore” review per category and market. Drop low-value or unsafe work rather than carrying everything forward because it was planned.

**Exit gate**
- Written launch readiness sign-off by product, security/privacy, engineering, data/supply, support and market owner; post-launch incident review; measured cohort outcomes; market 2 decision; Year Two backlog based on evidence. No “global scale achieved” claim without real global coverage and measurements.

---

## 7. Cross-cutting implementation workstreams

These workstreams span the whole year; sequence them by dependency and risk.

### Workstream 1 — Frontend and design system
- One coherent, accessible responsive experience around Explore / Find / Journey and local-context pages.
- Search with location, category, date/time and practical filters, but never let client-side filters be mistaken for server authorisation.
- Stable loading/empty/stale/error/cancel states and helpful narrow/widen-area options.
- Honest distinction between page view, contact request, quote request, accepted job, confirmed booking and completed outcome.
- Profile/provider/guide/teacher surfaces show only permissioned, attributed facts. Keep precise personal data private.
- Reusable consent, report/block, request-state, freshness/provenance and no-photo/no-result components.
- Design tests at 375, 390, 768, 1280, 1440 px; keyboard/screen reader, high contrast, reduced motion, 200% zoom and focus restoration. Human sign-off required.

### Workstream 2 — Backend/domain and integration
- Keep TypeScript domain contracts and server-only IO boundaries explicit. Validate input, auth and output size; cancel superseded reads; preserve request IDs and safe error types.
- Audit RLS, grants, exposed schemas, storage bucket policy, auth redirects, user enumeration and server/admin-client usage. Every table needs a role/action matrix and automated tests where practical.
- Use additive/expand-contract migrations, explain data backfills and rollback, and test upgrades on disposable databases. Any production migration or access-control change needs human approval.
- Use stable provider/source identity, import idempotency, evidence timestamps, freshness expiry, moderation state and source removal/withdrawal.
- Keep private user data out of public search indexes, sitemap, analytics payloads and model contexts.
- Build durable request/notification/event state with transactional consistency and idempotency; if a delivery service is unavailable, display the actual outcome and expose a retry/support path.

### Workstream 3 — Research and product discovery
- Each research claim carries source, date, market, sample size/method, uncertainty and a decision it may change.
- Research demand through interviews, search query analysis, partner interviews, competitor review, supply audits and small experiments. Separate search interest from willingness to pay and from available supply.
- Run unknown-unknown reviews: law, safety, accessibility, economics, competitor/platform terms, language nuance, data rights, edge-case users, disconfirming evidence and alternative architectures.
- A research project must end in a decision: build, test, wait, pivot or stop—not just a long report.

### Workstream 4 — SEO and organic acquisition
- Crawlable server-rendered pages with correct title/description/canonical/robots and real content.
- Shared evidence-gate for page metadata and sitemap inclusion; bounded complete sitemap enumeration; private routes excluded; no generated thin pages.
- Structured data only when backed by visible facts; photo/source attribution and licences honoured.
- Market-local keyword research for high-intent queries such as cleaning/turnover services, local guides and Spanish tutoring. Do not assume volume; collect the data.
- Track organic landing → useful result → qualified request → completed outcome. Monitor index coverage/canonicals/soft 404s and prune or noindex stale/thin URLs.

### Workstream 5 — Data supply and local network effects
- Make first-party provider onboarding, claiming, update/expiry and removal as important as third-party ingestion.
- Track real eligible supply by market/category, freshness, requestability, provider response, and user-reported quality. Clearly distinguish records found from all real-world supply.
- Where supply is sparse, offer broader localities, contribution routes or a useful alternative; never fabricate candidates or imply absence in the world.
- Start each market with a named local steward, partner pipeline, rights register, moderation/support coverage and provider update process.

### Workstream 6 — AI and agent governance
- AI should help users interpret retrieved evidence and help the team research/code/test, not invent real-world facts or silently exercise authority.
- Public assistant tools: read-only, constrained retrieval, same canonical eligibility, source citation, freshness and place isolation; no write/contact/booking/payment tools at the outset.
- Every model/provider needs an approved purpose, data/retention review, redaction, timeout, token/size limits, eval set, rate/cost cap, fallback and kill switch.
- Agent work follows inspect → task envelope → claim/lease → isolated branch → tests → exact-head CI → peer review → PR → human approval. Three materially similar failures trigger a pause and diagnosis, not an infinite retry loop.
- Keep Grok-specific operating instructions in the existing Grok prompt PR #248 and the canonical agent rules. Do not duplicate state files or invent autonomous capabilities not actually wired.

### Workstream 7 — Commercial and partnership operations
- Research providers, venues, language schools, tourism/community organisations, local business networks and data partners. Start with opt-in, manually verified relationships.
- Provide transparent product terms and distinguish paid placement from relevance; paid status must never silently alter a trust/relevance decision.
- Do not enable paid outreach, bulk email, scraping, automatic claims about partnerships or provider onboarding without explicit approval and appropriate consent/legal basis.
- Model unit economics including acquisition, onboarding, support/moderation, payment/provider fees, data costs, AI costs, refunds, chargebacks and taxes.

### Workstream 8 — Observability and customer support
- Maintain a durable operational view for main SHA, open/blocked tasks, active worker leases, CI failures, source health, request failures, stale data, security findings, launch state, spend and next safest action.
- Instrument product funnels with privacy minimisation: search attempted, useful result found, detail opened, enquiry started/sent/failed, provider responded, outcome declared and report/cancellation reason. Do not track more personal data than necessary.
- Create escalation ownership, service hours, incident severity, status updates, data correction/removal, account recovery, safety concerns and post-incident review.
- Metrics are decision aids, not targets to game. A lower number of sessions with more successful offline outcomes is a good result.

---

## 8. Metrics and proposed launch gates

Establish the baseline in Month 1. Do not fabricate a starting figure or retroactively claim improvement. The thresholds below are **proposed gates to ratify**, not a statement about current performance.

### User/product value
- Qualified result rate by market/category; time to first useful eligible result.
- Search-to-enquiry conversion, sent-to-provider-response, completed-outcome rate, cancellation/no-show rate, repeat provider/customer rate.
- Supply quality: percentage with current source timestamp, verified source/consent, clear service area, valid category, response path and no unresolved report.
- No-result rate and recovery: broaden search, change filters, contribute a request, or receive a transparent “not yet available” state.
- User/provider interviews demonstrate a repeatable job-to-be-done before broad rollout.

### Reliability and performance
- Proposed pilot availability ≥99.5% monthly, reviewed against real requirements.
- Proposed public browse p95 <500 ms under a declared pilot load where applicable; agree separate SLOs for expensive geographic search, write paths and AI.
- Proposed server-error rate <1% during pilot; track dependency failure and stale-data rates independently.
- Exercise backup restoration and document RPO/RTO before enabling consequential requests or payments.
- Load-test at expected pilot peak and at least 2× that expected peak; publish the workload model and limits. Do not infer global capacity from this test.

### Trust, security and privacy
- Zero unresolved critical/high security findings at release unless an owner-approved risk exception explicitly documents impact, mitigation and expiry.
- 100% of public inventory has defined provenance/publication/visibility semantics and a removal path; 100% of private paths stay out of sitemap/indexing.
- Every schema/RLS/grant/storage policy has an authorised role/action matrix and test evidence before production change.
- Reports, blocks, deletion/export, consent revocation and incident routes tested before the relevant feature launches.

### SEO and acquisition
- Live production robots/sitemap/canonical/SSR validation passes after approved publish.
- Route metadata and sitemap enumeration use the same eligibility decision; no private/demo/thin/stale/unattributed content is publicly indexed.
- Measure qualified organic traffic and downstream outcomes by page group, not page count.
- Never claim a search engine has indexed a page without Search Console or other authoritative evidence.

### Economics and operations
- Contribution margin per completed outcome/service cohort, partner willingness to pay, acquisition/onboarding cost, support minutes per outcome, payment fees, provider cost and AI cost.
- All automated jobs have an owner, schedule, budget, timeout, retry cap, logs, alert, cancellation, kill switch and human escalation.
- Measure task cycle time, stale-task rate, duplicate work, review changes, regression rate and recovery time. More commits or more agent activity is not success.

---

## 9. Market selection and expansion rules

Do not launch “everywhere” at once. Launch a repeatable market unit.

For each market, write a readiness dossier containing:
- Evidence-backed priority categories and customer segments.
- Search demand and competitor landscape, dated source references and uncertainty.
- Genuine supply and opt-in commitments; provider coverage by locality; supply freshness.
- Country/place hierarchy, language(s), currency, time zone and address formats.
- Source/data rights, attribution and retention constraints.
- Safety/moderation/support coverage, abuse escalation and owner.
- Jurisdictional legal review for the categories actually enabled.
- Privacy notice/consent, RLS/access-control evidence, account deletion/export.
- Technical SEO, domain/URL routing, localisation and live-host checks.
- Operating cost, unit-economics hypothesis and stop/pivot thresholds.
- Rollback and communications owner.

**Expansion rule:** a new country or category is not “live” until its dossier is accepted and an end-to-end real-data journey is verified. Never report staging, fixture data, a branch, a green CI run or a sitemap implementation as live market coverage.

Start by hardening the geography/data flows already represented in the repository. Select the cleaning pilot location and South American Spanish/guide pilot from research, not assumption. Expansion to another market requires proof of local supply and operational support, not only the ability to render a translated page.

---

## 10. Required Grok task protocol

Before each task:
1. Read this plan, `docs/programme/MASTER-PROGRAMME-SPECIFICATION.md`, `README.md`, `roadmap.md`, `AGENTS.md`, `docs/agents/README.md`, current `docs/agents/STATUS.md`, relevant ADRs, the exact issue, and related open PRs.
2. Fetch current main SHA and current PR/base/head/check state. Inspect all overlapping work. If active work overlaps, review/coordinate; do not overwrite it.
3. Create or update a durable task with objective, owner, status, lease, scope-in, scope-out, dependencies, acceptance criteria, tests, risk, evidence, reviewer, and human gates.
4. Choose the smallest change that measurably advances one milestone. State assumptions and confirm them through research or mark them UNKNOWN.
5. Work on a non-main branch. Do not force-push or rewrite history. Do not write through Lovable until its Git sync target is confirmed to be the intended non-main branch.
6. Implement tests alongside behavior. Preserve type safety, privacy, accessibility, source attribution and existing invariants.
7. Run frozen install, lint, tests, production build, relevant security/data tests and exact-head CI. Report warnings and skipped checks; do not call a skipped environment test a pass.
8. Review the diff for secret exposure, private data, authorisation, schema compatibility, duplicate architecture, migration risk, SEO leakage, accessibility, data rights and rollback.
9. Open a small PR with before/after evidence, check links, limitations, risk class, dependencies and manual QA that remains. Update durable status and handoff.
10. Stop and escalate on missing credentials/consent, production access-control changes, ambiguous domain semantics, legal/financial commitments, production deployment, unsafe source rights, conflicting main state, or repeated failure.

### Explicitly prohibited without human approval

- Merge/approval of Grok’s own PR or any autonomous merge to main.
- Deploy or production write; live source/partner feed activation; paid search/spend or billing changes.
- Secrets/credential access or disclosure; changing repo/branch protection, auth, RLS, grants, exposed schemas, storage access, or data-retention rules.
- Destructive or irreversible migrations, large backfills, account/identity decisions, mass provider/user outreach, booking/payment commitments, public partnership claims, or mass indexing/publication.
- Publishing generated “real” providers, people, locations, events, prices, reviews, ratings, qualifications, availability, or testimonials without evidence.
- Replacing `findSupply()` with a second matcher/ranker, using an LLM to invent candidates, bypassing the source policy, or converting a failed/empty query into fabricated results.

When the same material approach fails three times, stop. Record the attempts, logs, likely root cause, alternative approaches and required human decision.

---

## 11. Acceptance template for every implementation PR

Every Grok-authored implementation PR must answer:

- **User problem:** who is blocked and how do we know?
- **Evidence/research:** sources, dates, findings, sample limits, uncertainty.
- **Scope / non-goals:** exact paths and behavior included/excluded.
- **Current canonical owner:** which existing contract/component owns this behavior?
- **Frontend:** responsive states, keyboard/screen-reader details, translations, loading/error/empty/stale states.
- **Backend:** auth, validation, permissions/RLS, source/provenance, pagination, size/time/rate limits, cancellation, idempotency, logs.
- **Privacy/trust:** personal data, consent, retention, reporting, visibility, external claims, legal review.
- **SEO:** canonical, metadata, noindex, sitemap gate, structured data, privacy.
- **Tests:** unit, adversarial, integration, e2e/manual QA and data isolation.
- **Exact evidence:** branch/head SHA and passing CI links; list every skipped check.
- **Risks/reversal:** migration/feature flag, rollback method, monitoring and owner.
- **Dependencies/human gates:** credentials, source licence, reviewer, production/financial/legal decisions.
- **Outcome:** the measurable fact that will improve if accepted, and how it will be monitored.

A green test suite means the tested code passed those tests. It does not prove production data, live indexing, legal compliance, user adoption, production security or global-scale capacity.

---

## 12. Immediate next tasks, in order

1. **Reconcile repository truth:** current main SHA/ruleset/required checks, Lovable sync target and deployed backend/origin. Refresh `docs/agents/STATUS.md`; explicitly resolve the conflict with the baseline in PR #254.
2. **Triage the PR queue:** identify stacked/competing branches; preserve unique fixes; establish one integration chain for UI/map, one for work-opportunities, one for shared SEO/sitemaps, and one for security automation. Do not add more duplicate implementation branches.
3. **Close the P0 data/security gaps:** access-control role matrix, admin-client exposure review, real data versus fixture separation, secret hygiene, dependency audit, backup/restore evidence, production origin confirmation.
4. **Finish the core user journey:** real eligible record → search/map/locality/service page → details/provenance → correct enquiry/action → durable state/error → support/report. Test empty, stale, private, unauthorised and failed-source cases.
5. **Make search/sitemap truth consistent:** shared fail-closed indexability gate, complete bounded enumeration, private routes excluded, real-host smoke verification after approval.
6. **Choose pilot locations/category through research:** cleaning/property-turnover service pilot and Spanish learning/local guide pilot; collect provider/user commitments, source rights, competition, cost, safety and local regulatory evidence.
7. **Implement the first market vertical end-to-end:** provider onboarding, profile/listing, search, consented request, provider response, reporting and freshness; no payments until separately cleared.
8. **Only then enable assistant and automated jobs:** read-only grounded assistant with citations/evaluation/budget/kill-switch; durable worker proof in staging; human-approved controlled release.
9. **Run post-pilot economics and expand/pivot:** measure outcomes and local liquidity before adding more countries/categories.

These tasks form a priority order, not a licence to bypass approvals. If a human gate blocks one lane, work on a safe, non-overlapping task and document the blocker.

---

## 13. Definition of “global-market ready”

The product is ready to expand only when the organisation can demonstrate, not merely describe, that it can repeat these steps:
1. Choose a market from research.
2. Define category and safety policies.
3. Obtain genuine, rights-cleared supply.
4. Import/onboard that supply with provenance, freshness and removal.
5. Render fast, accessible, localised search and detail pages.
6. Support a safe, consented user-to-provider action with truthful status.
7. Moderate abuse and correct stale or false information.
8. Measure completion, supply health, user value, cost and reliability.
9. Keep private data private and prove authorisation with tests.
10. Verify the live site, SEO and operational monitoring after human-approved release.
11. Roll back or pause the market if trust, supply, safety, or economics fail.
12. Reuse the process for the next locality/category without pretending a working route equals working market coverage.

**First-year success is a verified learning-and-launch engine plus a small number of genuinely useful, sustainable pilots.** Worldwide growth follows from repeatable local trust and outcomes—not from the number of countries in a selector or the number of URLs in a sitemap.
