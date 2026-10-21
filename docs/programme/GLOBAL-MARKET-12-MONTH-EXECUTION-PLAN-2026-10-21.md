# Real World Atlas — Global Network R&D, SEO Recovery and Integration Master Plan
## Revision 2: full-stack audit, dependency recovery, AI integration, and a rolling 12-month route to worldwide usefulness

**Audit date:** 21 October 2026  
**Programme horizon:** 12 months from human acceptance; rolling, outcome-based, no guaranteed launch date.  
**Canonical repository snapshot:** main commit `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` (also recorded as the base SHA for current PR #262 when rechecked). Always refresh before acting.  
**Repository:** `mattleask373-rgb/life-lived-network`  
**Companion operating prompt:** [PR #248 — Grok Year-One Master Operating Prompt](https://github.com/mattleask373-rgb/life-lived-network/pull/248)  
**This plan:** replacement for the earlier version in [PR #262](https://github.com/mattleask373-rgb/life-lived-network/pull/262).

> **Mission:** Help people live more of their lives in the real world. Build a trustworthy network where a resident can find everyday activities or a cleaner, a host can find legitimate property-turnover help, a traveller can meet local people and guides, a visitor can learn Spanish with locals in South America, somebody can find work or exchange skills, and a village community can share real needs, offers, nature, culture, events and projects. Use AI to make discovery and operations more useful—not to invent real-world facts, manufacture supply or maximise screen time.

---

## 1. Executive direction

The next phase is not “add more pages” or “connect an LLM”. It is to integrate the strongest existing foundations into one dependable system, resolve competing implementation branches, prove privacy and source truth, establish a measurable market-launch engine, and grow supply and usefulness locality by locality.

**Worldwide reach is the direction; verified local usefulness is the unit of progress.** A global map with no reliable local information is not a global network. A thousand indexed service pages that cannot fulfil a request are not marketplace liquidity. A running AI workflow without durable state, identity, budget, cancellation and kill switches is not a 24/7 operator. A green unit-test suite does not prove production security, live SEO, source rights, or customer value.

The first-year outcome should be a repeatable, measurable, human-governed platform with several validated end-to-end journeys and evidence-backed pilot markets; thereafter, each market can be added using the same playbook. Do not promise that all countries or all categories will be operational in twelve months. Do not turn the aspirational billion-user north star into a capacity assertion or forecast.

### Three outcomes drive all work

1. **A real person reaches a real-world outcome:** find a current eligible result, contact/request a provider with consent, attend an experience, learn a skill, complete a work opportunity, contribute to a community, or understand honestly that no verified option is currently available.
2. **A market can be onboarded safely and repeatedly:** canonical place data, rights-cleared supply, localised presentation, trustworthy requests, moderation/support, technical SEO, measurement, legal review, reliability, and named ownership.
3. **AI improves verified usefulness per unit of human attention:** research intent and gaps, interpret queries, organise evidence, help providers maintain records, answer grounded questions, propose implementation tasks, test changes, and surface risks. Human owners retain consequential decisions and production authority.

This programme expands the living-world domains already described in `README.md` and the canonical Human–AI programme specification. It does not merge programme-state machinery into the product domain or replace the existing discovery authority.

---

## 2. Audit scope, evidence boundary and what “compromised” means here

This review reconciles current repository files, PR metadata and review notes available through GitHub, including `README.md`, `roadmap.md`, `docs/agents/STATUS.md`, `docs/agents/README.md`, `docs/agents/OBSERVABILITY.md`, `docs/programme/MASTER-PROGRAMME-SPECIFICATION.md`, SEO PRs #247/#249/#251/#252/#253/#257, map PRs #238/#242/#261, source/work-opportunity PRs #197/#241/#244/#259, AI policy PR #245, security automation PR #260, and issue reports #24/#29/#30/#31/#42/#74/#100/#111/#116/#117/#121/#164/#256.

**Important distinction:** this audit found documented integration conflicts, incomplete launch paths and potentially serious access-control risks. It did **not** establish that a malicious breach occurred. “Compromised” below means product integrity, privacy guarantees, SEO correctness or end-to-end wiring may be undermined by unfinished/competing work. Treat security items as findings requiring verification, not as proven exploits unless the evidence says so.

This is not a penetration test, a live production crawl, a hosted Supabase configuration inspection, a legal opinion, a global market study or a production load test. The current hosted origin could not be independently validated by the available tools. Historical repository notes report platform-default `robots.txt` and HTML 404 at `/sitemap.xml`; these reports are not a new live measurement. The production domain, deployed route precedence, effective database grants/RLS, production data quality, Search Console state, user metrics, performance, cost and restore capability must be verified by an authorised operator.

The current open-PR search yielded a **100-result capped set**; this is not an exhaustive exact PR count. An earlier baseline counted 93 before subsequent work. Queue cardinality itself is a risk: duplicated effort, stale base branches, conflict debt, review load and misleading “green CI” evidence. Every audit pass must check the live current main SHA, pull-request base/head SHA, reviews and exact-head status before acting.

---

## 3. Repository audit: what exists and what must not be mistaken for completed integration

### 3.1 Canonical foundations to preserve

The repository already contains substantial product and programme infrastructure:

- TypeScript, React, TanStack Start/Router, Supabase/Postgres/Auth/RLS, Bun, Vitest, ESLint and a production build pipeline.
- The canonical place/locality hierarchy, generic locality pages, shared service taxonomy and public/private SEO helper conventions. The geography foundation is not yet evidence of complete, maintained global coverage.
- The canonical discovery authority: `findSupply()` in `src/lib/supply-engine.ts`; grounded match reasoning lives in `src/lib/grounded-matching.ts`. Presentation and AI must not create a second candidate/ranking authority.
- Existing world/listing retrieval and normalisation, provider-neutral ingestion contracts, source provenance/freshness patterns, work-opportunity schemas and fixture-first source adapters.
- Need/possibility/connection paths, account/private features, saved place memories, user privacy controls and export capability described by the roadmap.
- Grok-inspired home/detail/map design and the map/list synchronisation work are **not all merely open drafts**: PRs #211 (core accessible redesign), #220 (home map/list sync) and #231 (Journey/Road Trip design extension) are reported closed/merged. Verify current main and preserve the accepted implementation; do not restart those PRs or reapply stale diffs. Their historical verification and limited manual QA do not prove every current end-to-end journey works.
- Place/service route foundations and technical SEO utilities for title, description, canonical, privacy and XML generation.
- A signed-in, schema-bounded draft-assist helper that does not automatically save user drafts.
- A fail-closed “Ask this place” eligibility policy candidate (#245), but it does **not** constitute an active public model endpoint. Its own PR states current records lack all required model-use/right/review attestations.
- AI-agent/continuous-engineering operating documents, worker lanes, leases/heartbeats and orchestration contracts in the repository/PR queue. They do **not** prove that a durable authenticated always-on executor is live.

For every item, verify code on current main, real deployment behaviour, permissions and test evidence. Keep these distinctions in the status file: **implemented in code**, **tested in CI**, **verified in staging**, **verified in production**, **live and monitored**.

### 3.2 Governance and shared status

`docs/agents/STATUS.md` reports main SHA `8d79247991187bf64813cf72e3ec75aeb508e2e9` and says ruleset enforcement is disabled. PR #254 reports main SHA `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` and says main protection is active; the base SHA of PR #262 is also `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`. The status document is stale or the observations are from different times. The current PR search alone cannot prove the present ruleset setting.

**Required before other integration work:** refresh the default branch SHA and repository/ruleset settings directly, verify PR review/required checks/last-push approval/resolved threads/no bypass, then update the canonical status document with a UTC timestamp and direct evidence. Confirm the Lovable project sync repository and branch and the deployed backend project by a human with dashboard access. Never guess that a connector’s default is the safe target.

The historical `.env` concern in issue #125 is reported as resolved by the current-main hygiene work recorded in PR #246: root `.env` absent and `.env.example` placeholders only. Re-check tracking safely; do not fetch, print or copy secret values. Run repository secret-history scanning and rotate any credential that is actually exposed. Removal from the current tree alone does not erase Git history.

### 3.3 SEO and integration PR inventory

- **#247 — shared locality/service route indexability gate:** adds explainable decisions and tests for real content, freshness, provenance and completeness. It notes that current-main normalisation drops `listings.last_checked_at` from `rowToEntry()`; some ingestion freshness states are ambiguous. This is a material data-contract dependency.
- **#249 — dynamic sitemap candidate:** includes separate simpler locality/service gates and a non-paginated place-table query with a hard limit. A Supabase/PostgREST cap lower than that limit can silently truncate the hierarchy without proving source completeness. The PR comment already identifies both the eligibility mismatch and pagination risk.
- **#252 — combined fail-closed gate/sitemap candidate:** proposes one route/sitemap eligibility path, numbered sitemap shards, complete scans, short-lived cache and failure-to-empty dynamic paths. It appears to be the most cohesive *candidate* for integration, but still needs exact-diff, policy-parity, pagination/ordering, route semantics and deployment review. Do not assume the branch is safe merely because Verify passed.
- **#253 — private Life List SEO fix:** makes `/life-list` private/noindex and removes it from public sitemap paths. This matters because the product says the list is private.
- **#257 — breadcrumb JSON-LD:** creates breadcrumb structured data from visible canonical hierarchy. It correctly avoids invented LocalBusiness/review/event claims and does not claim hreflang while translated variants are absent.
- **#251 — live SEO smoke monitor:** a read-only daily/manual GET checker for homepage metadata, robots and sitemap index/children. It has passing repository CI reported on its last documented head, but the workflow was a draft and the live published test has not been proven to run successfully. Its fixed-page allowlist must be reconciled with #253’s removal of `/life-list`; otherwise the monitor can encode the wrong policy.
- **#238/#242/#261 — viewport/map branch family:** #238 contains cached-refresh, cancellation, broad-view, and 200-row-limit protections; #242 was used to integrate the viewport/list experience. An earlier review found the span limit only in the browser, but a follow-up comment on #242 reports that a server-side queryability guard was later added and passed Verify on that branch. Do not treat that specific span finding as still unfixed without checking its exact head. The **separate** issue #256 describes a serious locality-scope failure when more than 400 descendant IDs are present and date-line map projection disagreement; #261 proposes typed fail-closed `SCOPE_TOO_WIDE` and antimeridian fixes, stacked on #242. The sequence and final-head fixes still require verification.
- **#241/#244/#259 and #197 — source freshness/work opportunity:** #241 preserves `last_checked_at` and reviewed WorkOpportunity terms through the canonical normaliser; #244 provides a fixture-first Adzuna adapter without network calls/credentials/activation; #259 rejects contradictory paid/unpaid categories; #197 is a stale combined reconciliation branch. Select one clean current-main integration sequence and port unique fixes; do not merge overlapping chains independently.
- **#260 — CodeQL/Dependabot/dependency audit:** reports a previously found set of 12 advisories, patched within ranges, and successful CI/security checks on its documented head. It is still a draft; it changed Bun lockfile format to v2. Confirm the deployed/Lovable build supports it and re-run the exact head before integration. CI security automation is not production security verification.
- **#245 — Ask-this-place policy:** an eligibility policy only; no UI, endpoint, model call or retrieval path. Integration requires real server-attested publication, data quality, no-demo, source rights, review, model-use permission, freshness and place-scope evidence.
- **#111 — public locality API issue:** current issue text says the code slice is implemented but NOT LIVE and hosted proof is pending. It requires parity with the shared sitemap/indexability rules, stable pagination/version/error semantics, privacy-safe observability and a hosted GET proof before saying “LIVE”.
- **#164 — default ACL issue:** historical read-only metadata reported broad default privileges for `anon` and `authenticated` on the public schema across object-creating roles. Reachability/impact was not fully demonstrated. Treat it as a release-blocking access-control audit until there is a sanitized table/owner/ACL/RLS/policy inventory, role/action matrix, disposable-DB tests and authorised human review.
- **#74/#100/#116/#117/#121 — autonomous control plane:** issue evidence conflicts over whether table/migration lineage exists only on a branch or is correctly represented on current main. #100 reports references to `agent_tasks` without a durable table definition on main; #116 specifies a competing canonical migration lineage that must be reconciled, not copied wholesale; #117 demands hosted non-production adversarial proof; #121 requires an actual durable scheduler/heartbeat/agent end-to-end trial. No autonomous production executor is proven.
- **#29/#30/#31/#42 and #19/#20/#21/#24/#25/#36/#45 — growth/global research lanes:** the issues define search-intent front door, privacy-safe conversion telemetry, internationalisation, data acquisition/freshness, SEO-quality checks, supply gaps, product traction and performance/trust work. These are useful source task definitions, not evidence that every workstream is already implemented.

### 3.4 Severity-ordered findings

| Priority | Finding | Evidence/status | Required remediation / release rule |
|---|---|---|---|
| P0 | Repository/production source of truth can drift between docs, branches, Lovable and Supabase | Conflicting status snapshots; deployment not independently verified | Verify main SHA, protected settings, sync branch, production origin/backend; write one dated status. Stop production writes until target is confirmed. |
| P0 | Public-schema default privileges and effective RLS/grants are incompletely proven | Issue #164 records broad historical default ACLs; actual application reachability still needs testing | Complete sanitized ACL/RLS/storage matrix and disposable DB adversarial tests; human approval before any hosted change. |
| P0 | Candidate map integration can widen locality beyond the intended scope when descendants exceed the cap | Issue #256 against map branch; #261 is stacked proposed fix | Never merge #242 without checking final server query path and #261’s typed fail-closed or equivalent bounded merge. Selected locality must never silently turn into global results. |
| P0 | Private “Life List” SEO policy conflicts with a live-smoke fixed-page allowlist | #253 removes `/life-list`; #251 earlier allowlist contains it | One public-route registry, route metadata and checker derive from it; private content remains auth-protected and never in public sitemap. |
| P1 | Competing SEO implementations can ship different eligibility decisions | #247 and #249 overlap; #252 is a combined alternative | Choose/rebuild a single canonical route + sitemap chain. Preserve unique tests, close/supersede alternatives only after diff audit. |
| P1 | Source freshness/provenance is lost or ambiguous at the normalisation seam | #247 and #241 document `last_checked_at` loss and ambiguous states | Integrate freshness through `WorldEntry`/normalisation; use explicit quality/freshness values; missing evidence must fail closed for public indexability and AI context. |
| P1 | Sitemap enumeration can be partial but appear complete | #249 table scan uses a single limited places query; scale requirements exceed a single warm-instance snapshot | Cursor-safe deterministic pagination or database-side enumeration; hard-cap/error must emit no dynamic URLs, never a partial success. Verify output count/shards/checksums and restart consistency. |
| P1 | The live crawler contract is not verified | #251 still draft/unrun against published host; historical reports of platform-default robots and HTML 404 are not fresh measurements | Fix hosting precedence, choose canonical sitemap index, run the monitor from CI against the exact deployed origin, and independently inspect robots/sitemap/status/SSR metadata. |
| P1 | Map query limit is confused with complete discovery | #238/#242 use a 200-record page; a page cap is not a complete-world guarantee | Show “loaded results” honestly, use stable pagination/cursors where useful, preserve cancellation/cached-error state and document zoom/locality limits. |
| P1 | Work opportunity and source adapters are still staging-oriented | #244 explicitly has no network calls/credentials/activation; #241 notes the persisted payload may not exist | Complete one reviewed contract→staging→publication pipeline and prove real permitted source/supply before user-facing availability claims. |
| P1 | AI policy has no live retrieval boundary | #245 policy-only, attestations absent in current records | Keep model endpoint/UI disabled until server-grounded context, citations, isolation, evals, rate/cost caps and rollback are accepted. |
| P1 | Durable 24/7 executor is unproven and its persistence lineage is conflicted | #74/#100/#116/#117/#121 | Reconcile existing migration history; prove identity, project scope, lease fencing, idempotency, RLS, cancellation and kill switch in non-production before scheduling real workers. |
| P1 | Worldwide localization and market stewardship are not proven | #31 asks for audit of UK-centric geography, locale, time/currency/date and address assumptions | Build a versioned market/locale model and source-rights register before claiming full global coverage. |
| P2 | SEO/growth funnel is not fully measurable | #29/#30/#36 define work but no reliable baseline was confirmed | Implement privacy-minimised typed funnel events and a dashboard only after telemetry scope and persistence/privacy review. |
| P2 | Security automation may conflict with deployed build tool versions | #260 reports Bun lockfile v2 and CI success but deployment compatibility unknown | Validate exact runtime in CI/deployment staging; no lockfile/toolchain change without exact-head CI and rollback. |

**Release rule:** P0 findings block a broad public-market expansion. P1 findings block the feature or surface they affect. If a finding affects only one category, keep that category disabled while delivering unrelated safe work.

---

## 4. A single integrated global architecture

Build on the existing stack, not a rewrite. Add new infrastructure only when measured limits show it is needed. The architecture should be one evidence-preserving flow:

1. **Intent capture:** natural-language or structured user request in their language; explicit manual place choice and date/time where needed. Never require GPS permission or a social account just to browse.
2. **Canonical place resolution:** resolve to existing `PlaceIndex`/place identifiers, with country, locality, parents, aliases/transliterations, coordinate confidence, timezone, language and source evidence. Ask the user to disambiguate when the place is ambiguous; never infer precise personal whereabouts.
3. **Deterministic canonical retrieval/discovery:** server validates scope/permissions and bounded query parameters; reads published, eligible data; applies canonical taxonomy and the existing `findSupply()` path. Avoid a second matcher/ranker. All query limits/pagination are explicit.
4. **Evidence-aware eligibility:** evaluate publication/visibility, provenance/rights, freshness, data quality, moderation, source status, locality/service completeness and user consent. Return explicit reason codes. Do not transform “not in our dataset” into “does not exist”.
5. **AI interpretation/explanation:** when enabled, the model may clarify ambiguous intent, translate user input, summarise retrieved eligible records and explain matched evidence. Output contains source IDs/URLs, last-checked values and uncertainty. Deterministic code validates all claims and action schemas. The model cannot create candidates, infer availability, override eligibility or self-authorise actions.
6. **Action/transaction boundary:** separate service enquiry, connection request, event interest, application, booking, payment and completion. Each is its own truthful server-side state machine with consent, permission, idempotency and audit. Do not label an enquiry as a booking or an intention as a completed outcome.
7. **Measurement and feedback:** measure search usefulness, safe action, response/completion, failed attempts, stale sources, no-result recoveries and user/provider correction. Remove or aggregate PII; no raw private contact details, precise residential coordinates or unnecessary raw query retention.
8. **Operations/control plane:** data freshness, ingestion health, SEO audits, customer support, moderation, security checks, worker claims, cost guardrails and task handoffs. One canonical control plane, one queue/state vocabulary and explicit human gates.

### Personas and real-world tasks

Support the distinct needs of:
- residents looking for daily activities, practical help, community, music, food, nature, projects and people nearby;
- short-term-rental hosts/property managers seeking legitimate cleaning/turnover support and cleaners seeking safe, clear paid opportunities;
- travellers and temporary residents seeking local guides, language exchanges, cultural experiences, casual work where legally permitted, volunteering and community connection;
- local teachers, guides, artists, venues, businesses, tradespeople, organisations and event hosts seeking participants or customers;
- people seeking or offering skills, time, collaboration, work, training and community support;
- moderators, market stewards, source partners and support operators responsible for the trust fabric.

Casual work must not imply eligibility to work in a jurisdiction, a visa/work permit, guaranteed pay or accommodation. Provide locally reviewed disclosures and sources. Safety and legal boundaries may mean some categories are not launched in some markets.

### Dense city versus small village

A city may support neighbourhood-level service search and multiple categories; a small village may have one current provider, community contribution paths, nearby towns, regional experiences or no verified supply. The interface and indexability rules must adapt:
- display the current scope, data freshness and number of eligible results;
- keep sparse pages usable even when they must remain noindex;
- offer a broader locality or user-approved search radius, never silently widen scope;
- invite verified community/provider contributions with moderation and provenance;
- avoid promising all categories are locally available;
- link to useful neighbouring places only when the geography is canonical and evidence is clear;
- never create indexable village×service pages merely because a URL can be generated.

Every locality can eventually have a route; not every route is necessarily indexable, fully populated, or “launched”.

---

## 5. SEO recovery and global search growth — implementation specification

SEO is a trust and discoverability layer for real service—not an independent page-generation engine. Search demand discovers problems worth researching; it does not prove users will convert, supply exists, or a page deserves indexing.

### 5.1 First recover the live crawler contract

Before adding more SEO features:
1. Confirm the canonical production origin and which host/CDN/deployment path serves it.
2. Probe `/`, `/robots.txt`, `/sitemap.xml`, `/api/public/sitemap.xml`, `/api/public/sitemap-pages.xml`, and a known locality/service route with GET only. Record UTC timestamp, DNS/host path if available, HTTP status, final URL, redirects, content type, response bytes, canonical and robots metadata, and cache headers.
3. Determine why the historical probe reported default `robots.txt` and HTML 404 for `/sitemap.xml`; distinguish code route correctness from static asset/CDN/deployment precedence. Do not publish success on the basis of a local build.
4. Choose one canonical public sitemap-index URL. Other legacy URLs must be an explicitly tested redirect or deliberately deprecated response; avoid duplicate independent index documents.
5. Ensure the sitemap URL listed in robots points to the canonical index actually served. Do not point robots at a hidden API route while production serves a root 404.
6. Deploy only with owner approval; re-run live smoke and verify production HTML/crawled URLs afterward.

The #251 checker is useful when brought onto the accepted branch and configured for the exact deployed origin, but it must be corrected and operated as a guard rather than a claim of automatic repair. It must check root/API endpoint precedence, child sitemap paths/content type/status, unexpected index entries, redirect paths, canonicals, privacy, metadata, and the true current public-page registry. A GET-only monitor cannot repair a hosting misconfiguration.

### 5.2 One indexability policy, not three versions

The route metadata, internal links, public API eligibility, and sitemap generator must share one pure policy and one normalised evidence object. Candidate #252 may serve as the starting point only if exact-code review proves this parity; otherwise port the best unique elements into one fresh current-main branch.

The policy should include explicit outcomes/reason codes for:
- canonical place exists and path is valid;
- service/category exists and belongs to the supported taxonomy;
- genuinely published and public data, excluding demo/fixture/draft/private/reported/expired/cancelled records;
- meaningful unique page content and user utility;
- freshness, source identity, provenance, attribution and rights;
- current service/provider/request information when a page claims it;
- sufficient local evidence for the category and locality;
- correct locale/content variant and canonical URL;
- no unresolved collisions, malformed slugs or unintended parent/child substitution;
- moderation/policy gate passed.

A locality threshold of at least three genuine current records and a service-page threshold of one eligible real record are current candidate rules, not a universal guarantee of quality. Preserve them only if review shows they match the actual content and user-value definition. A single listing does not automatically make every page helpful. A missing/future/malformed `last_checked_at`, ambiguous “unverified” status, or missing rights evidence must fail closed for source-dependent indexing and AI context. Reconnect the real `last_checked_at` through `rowToEntry()` and `WorldEntry.lastCheckedAt` (candidate #241) before using freshness to grant eligibility.

### 5.3 Complete and scalable sitemaps

- Use explicit cursor/range pagination for both place hierarchy and listings with stable deterministic ordering and tie-breakers; validate every page’s count and errors. A single `.limit(N)` call is not proof that a table was completely enumerated.
- If any chunk is missing, the source scan fails, a cap is reached, an upstream result is truncated, a page repeats, or a cache holds an incomplete snapshot, emit no dynamic URLs (or a clearly failed endpoint) rather than a partial sitemap that looks complete.
- Use a sitemap index and bounded shards. Google’s documented limit is 50,000 URLs or 50 MB uncompressed per sitemap; a 40,000-URL target shard cap from #252 leaves headroom but byte size must also be checked. Keep URLs absolute, canonical and stable, and emit only URLs intended for search.
- `lastmod` must come from a real meaningful update timestamp; do not manufacture daily freshness, use build time as content freshness, or re-emit a URL because cache time changed.
- Cache only complete snapshots with a bounded TTL; include source revision/updated marker and stale-cache behavior. Document worker memory/time limits and database cost. For larger inventory, move toward database-side enumeration/sharding rather than scanning 20,000 listings and thousands of places per cold edge worker.
- Monitor generated counts by country, locality depth, category and locale, exclusions by reason, scan duration/rows read/cache hit/error, duplicate/canonical collisions and shard sizes.
- Every dynamic route and shard receives privacy, XML encoding, redirect, pagination and regression tests.

### 5.4 Private paths and the Life List

The Life List must follow its actual product contract: private data stays user-scoped, authenticated and out of public sitemaps, public API payloads, pre-rendered static HTML, structured data and AI contexts. Reconcile #253 with #251’s fixed-page allowlist so the automated smoke test does not expect `/life-list` in the public sitemap.

`robots.txt` is not access control. Do not rely on a disallow rule to protect content. Enforce authentication/authorisation on every data path, never expose per-user content to anonymous reads, send a safe `noindex` response for crawlable signed-out/private page surfaces where feasible, and ensure sensitive pages require authentication even when a URL is known. Be deliberate about robots/noindex interaction: if a route is disallowed to crawlers, they cannot see its page-level noindex. Private data must still be safe even if robots rules are ignored.

Centralise public/private route policy rather than hand-maintaining `PUBLIC_PATHS`, `PRIVATE_PATHS`, static sitemap entries, dynamic API expected sets and smoke-test copies independently. Generate or test all copies from a canonical route registry.

### 5.5 Technical and content SEO for the global network

1. **Canonical URL model:** stable country/place/service/category/event/guide/opportunity route shapes; lowercase/canonical slugs; no duplicate aliases without redirect; strip tracking parameters from canonicals; avoid indexing filter/query permutations; avoid parent and child paths representing the same result set.
2. **Internal discovery graph:** useful links between country → region → city/town/village → supported services/activities → provider/experience when eligible; breadcrumb paths match visible UI; link to related categories only when they exist and help. Do not mass-link empty pages to each other.
3. **SSR and crawlability:** critical public content, headings, source attribution, availability caveats, canonical, robots and JSON-LD should be present in server-rendered HTML and verified against the published deployment.
4. **Structured data:** #257 breadcrumb JSON-LD is a safe early slice when backed by visible hierarchy. Add `LocalBusiness`, `Event`, `JobPosting`, `Course` or other schemas only when the page actually represents that entity and the visible fields support it. Never manufacture reviews, ratings, addresses, credentials, prices, event status, employment facts or booking actions to fill a schema. Syntactically valid JSON-LD does not guarantee a rich result.
5. **Images and attribution:** keep only source-backed/rights-cleared images with credit and consent where required. Do not treat design-reference assets or user uploads as licensed public SEO assets automatically.
6. **Freshness and removals:** expired opportunities/events, withdrawn providers, reported records and removed source items must be reflected in page state, metadata and sitemap within an explicit SLA; return appropriate status/noindex/redirect behavior without leaving stale pages indexable indefinitely.
7. **Multilingual/global SEO:** first implement real locale content and locale-aware canonical routing; only then add correct `hreflang` alternates to genuinely equivalent translated pages and reciprocal mappings. Do not emit hreflang merely because a translation is planned. Avoid locale-by-cookie-only content as the sole way crawlers discover languages.
8. **Evidence-led content:** local explainers can add value by explaining real local practices, language, service scope, cultural context, and available choices with local review. AI can assist drafts but must cite the evidence and obtain review where claims are consequential. Generic autogenerated city/category copy, spun translations and doorway pages are prohibited.
9. **Search demand research:** query clusters such as “cleaner for short-term rental turnover”, “Spanish conversation partner in [city]”, “local guide”, “things to do tonight”, “casual seasonal work” and “community gardening” should have evidence for intent, locale, seasonality, competition, provider density and user task. Record source/date/confidence/sample limits; never invent search volume.
10. **Conversion, not ranking alone:** measure search landing → locality/category resolution → useful eligible result → detail → consented request/action → provider response → declared completion. Track no-result resolution (broaden, request, contribute) and support/report rates. Use Search Console and analytics only after human-approved account/access and privacy scope.

### 5.6 External search-engine standards referenced

Keep these sources in the research checklist and recheck before release:
- Google [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies): doorway/scaled-content risks, including mass pages produced using generative AI or scraped/transformed material that add no user value.
- Google [multi-regional and multilingual SEO](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites): locale-specific URLs and correct language/region signals; do not assume IP-based content switching is sufficient.
- Google [sitemap construction and limits](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): 50,000 URLs or 50 MB uncompressed per sitemap; use shards/index and absolute canonical URLs.
- Google [structured-data general policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) and [LocalBusiness documentation](https://developers.google.com/search/docs/appearance/structured-data/local-business): markup must truthfully represent visible page content; do not use invented or irrelevant properties.
- OWASP [LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/): RAG alone does not eliminate prompt injection; constrain capabilities, validate output, separate untrusted content, enforce least privilege and adversarially test.

---

## 6. App integration recovery

### 6.1 Frontend / design integration

Keep the merged #211/#220/#231 work as the existing visual foundation. The next task is not a redesign rewrite; it is integrated QA and completing real action paths:
- Explore/search/home, explicit locality choice, map/list, locality/service pages, Journey/Road Trip and detail sheets must share the same loaded/eligible result facts.
- Preserve list entries that lack safe coordinates; never invent map pins. Distinguish viewport from chosen locality and the actual result scope.
- Display loading, empty, stale-cached, cancelled, failure, broad-area and “more results may exist” states honestly, including on small screens.
- Finish keyboard operation, visible focus, focus restore, semantic landmarks, screen readers, 200% zoom, reduced motion, high-contrast checks and 44px touch-area review in real-browser/manual QA.
- Preserve photo provenance and safe fallback; confirm licences and typography/assets rights before launch.
- Keep all critical forms usable without geolocation permission; use editable manual country/locality/search fields and remember only with consent.

### 6.2 Map, locality scope and large datasets

Before accepting #242, review its latest branch head and unique review comments. If it includes the server-side span guard described in the follow-up, retain it and verify current head. Then integrate #261’s descendant-scope and antimeridian fixes in sequence—or deliberately replace them with an independently reviewed equivalent.

Required rules:
- a selected locality with more than 400 descendants must never silently remove the locality filter; either execute a bounded deterministic chunk/merge with stable ordering and cursors or return typed `SCOPE_TOO_WIDE`;
- longitude wrapping near ±180° must agree among server bounds, map projection, point-in-view tests and map/list partitioning;
- abort superseded requests and do not count intentional cancellations as data failures;
- a failed refresh with usable cached results must disclose stale status; never convert error to known-empty;
- 200 rows means “200 records loaded”, not “all records in the area”. Define pagination/load-more or zoom-in behaviour;
- both client and server validate viewport bounds; response limits do not substitute for bounded database work;
- test sparse village, dense city, null/out-of-range coordinates, overlapping grid clusters, huge locality hierarchy, stable ties, cache refresh, cancellation and date-line cases.

Reconcile #238’s unique UX/observability fixes with #242/#261 once. Avoid a competing PR that edits the same bounds/listing files.

### 6.3 Work, service and source data integration

Create one clean chain: strict domain contract → bounded source adapter → stage/normalise/dedupe → provenance/freshness/rights → local/category resolution → moderation/policy gate → publication → canonical route/search → user action. Existing source contracts should be reused and deliberately extended; no silent schema or semantics shift.

For WorkOpportunity specifically, reconcile #241, #244, #259 and any useful parts of #197:
- `last_checked_at` must survive normalisation for permitted source/confirmed records only;
- compensation amount, currency, basis, dates, work location, conditions, engagement type, source and expiry stay explicit; do not infer pay or work eligibility;
- contradictory paid/unpaid volunteering/training combinations are rejected;
- Adzuna and other feeds remain fixtures/staging-only until terms, API ownership, credentials, rate limits, retention, rights, jurisdiction, moderation, support, cost and publication approval are verified;
- imports are idempotent and deduped; expired/cancelled or rights-withdrawn items are removed from result eligibility, structured data and sitemap promptly;
- provider claim/onboarding and first-party supply update are equally important to third-party feeds.

For public locality APIs, make response DTO, page tokens/cursor, scope, errors, cache/ETag, freshness and indexability consistent with the same canonical policies. An API route existing in source does not mean it is deployed or live; record a successful hosted check before calling it live.

### 6.4 Security, privacy and trust integration

Treat security/privacy as part of the application contract, not a final checklist:
- Inventory public schemas/tables, owners, grants, default privileges, column privileges, RLS enabled/forced, policies, views/RPCs and storage bucket rules.
- Build a role/action matrix for anonymous visitor, signed-in owner, unrelated signed-in user, provider, moderator/reviewer, ingestion worker and control-plane worker.
- Test that an anonymous caller cannot read private Life List/memories, private profiles/contact details, private conversations, another user’s data or control-plane tasks/events/RPCs; validate every public suggestion path and admin-client read at field level.
- Existing issue #164’s default ACL concern needs non-production proof. Do not run a hosted grant change from this plan; design the migration/rollback and get human security approval first.
- Ensure all server write functions bind identity from trusted auth context, validate IDs/enums/lengths/time bounds, check blocks and permissions, and apply rate limits/idempotency.
- Provider “verified” badges must correspond to a documented proof policy and its date/expiry. Do not equate registration, self-assertion or scraped listing data with a verified identity or qualification.
- Make report/block, account/data export/deletion, consent withdrawal and source correction/removal work end-to-end.
- Treat historical secret hygiene as risk until secret scanning/rotation evidence is recorded. Never include secret values in issues or handoffs.
- A robots disallow or frontend conditional is not a permission boundary.

### 6.5 Metrics and measurement integration

Issues #29, #30 and #36 already define the direction of a vendor-neutral growth/telemetry spine. Re-audit current analytics/events before adding anything. Keep the smallest useful typed contract and avoid introducing an analytics vendor as an architecture dependency.

Measure events such as:
- search started/submitted (with raw text redacted/avoided where unnecessary);
- canonical locality/intent resolved or ambiguous;
- eligible result shown, no-result, stale/error, broadened scope;
- detail opened, request initiated/sent/failed;
- provider response, accepted/declined/cancelled, declared completion;
- contribution/provider onboarding, source correction, moderation report;
- SEO landing route/category, source freshness and route eligibility outcome.

Use pseudonymous session or consented account context only as justified. Do not collect precise home coordinates, private phone/email, raw messages, sensitive needs, or cross-site identity graph for growth analytics. If persistence requires schema/RLS changes, create a separate migration task and gate it; do not smuggle it into a frontend PR.

---

## 7. Full AI integration model

“Fully integrated AI” means useful AI within explicit boundaries across the user experience and engineering operations, not unrestricted agents or one model call added to every screen.

### 7.1 User-facing AI, phased

**Phase A — no-model deterministic foundation**
- Search parses obvious service/activity/place/time fields through deterministic existing contracts.
- Show confirmation choices where ambiguous. Keep original query intact for the user, but minimise retention and redact analytics.
- Call the canonical place resolver, retrieval and `findSupply()`/existing domain path. Do not add a separate embeddings/vector/LLM matcher by default.

**Phase B — read-only grounded assistant**
- Ask-this-place can launch as a small feature-flagged pilot only after policy #245 or equivalent is integrated, required attestations are represented server-side, and public API + source rights + RLS boundary pass review.
- The server supplies only eligible, current, place-scoped content and source references to the model. Clients never submit an authoritative list of records for the model to trust.
- Responses distinguish facts from interpretation, cite source/title/URL/check date, and say “not recorded” or “unknown” when evidence is absent.
- Strict schemas validate citations and permitted actions. The model has no database write, contact, booking, payment, publish or unrestricted internet-search tools.
- Evaluation tests cover no-result, contradictory records, stale data, multilingual/code-switch input, private/cross-place leakage, malicious text in a provider listing, prompt injection, credentials/PII, fabricated availability, unsafe requests, source attribution, cost and latency.
- Include timeouts, request/context/output limits, abuse/rate limits, daily/monthly spend cap, redaction, provider retention review, deterministic fallback, observability and a kill switch. Feature stays off until the exact criteria pass.

**Phase C — consented user helpers**
- Explore planning a day, language-practice discovery, itinerary assembly and recommendations only by transforming user intent plus eligible records. Preserve correct local time zones and do not claim routes/travel times when no route provider exists.
- User-controlled memory/preferences are optional, inspectable, exportable/deletable and not used to infer sensitive facts without consent.
- AI translation must not silently alter critical terms, pay, safety instructions, working conditions or cancellation policy; use human-reviewed strings for consequential interface copy.

**Phase D — operational agents**
- Search Research agent (#19): query patterns, seasonality, demand hypotheses and evidence refs, never fabricated volume.
- Locality Intelligence (#20/#31): geography coverage, names/aliases, language and market-readiness dossiers.
- Supply Gap (#21): uses canonical discovery output to identify missing *eligible data*, not claim no providers exist.
- External World/Events (#22) and Data Acquisition/Freshness (#25/#42): source-health monitoring, contract parsing, stale/cancelled-record proposals and staging tasks.
- SEO Quality (#24): eligibility parity, thin/doorway/duplicate risk, stale pages, sitemaps, canonical and live crawl tests.
- Growth/Measurement (#29/#30/#36): funnel evidence, low-risk experiments, completion quality and provider-side supply.
- Reliability/Security (#32/#45): safe performance experiments, vulnerability triage, access policy tests and incident readiness.
- Support/moderation helper: summarise reports and suggest actions, but do not silently adjudicate high-impact reports or reveal private data.
- Orchestrator: chooses bounded tasks according to dependencies/lease/priority, checks CI evidence, updates the queue and escalates. It does not bypass human gates.

Use the existing task/control-plane patterns where possible; never run multiple agents editing the same path without an explicit ownership agreement. Agent result is not evidence until artifacts, exact commits and tests are verified.

### 7.2 Control plane must be proven before calling this continuous

Issues #74/#100 and #116 disagree on what persistence migration lineage is present/authoritative. Resolve by comparing current main migrations, alternate branches and database types; do not create a second `agent_tasks` schema or assume a hosted table exists.

Required staging proof:
- durable task/run/attempt/event state with one canonical status mapping;
- server-derived authenticated actor identity and approved project/workspace scope;
- atomic claim/lease/heartbeat/release and stale reclaim with fencing tokens/generation;
- idempotent events/results, rejection of conflicting duplicates and cancelled-task resurrection;
- RLS denying anon/authenticated direct table/RPC access except deliberately granted public surfaces;
- bounded dispatch, capability declarations, timeout, cancellation, retry/backoff, dead-letter visibility, budget accounting and kill switch;
- operator dashboard showing queue depth, lease expiry, last successful heartbeat, blocked reason, last CI evidence, provider failures and cost;
- human approval IDs for gated tasks, audit trail and alerts/escalation;
- non-production adversarial matrix from #117, with exact migration SHA, RPC responses and environment recorded.

Until a real scheduled job records a verifiable heartbeat and completes a bounded end-to-end task in a confirmed non-production environment, describe it as **scheduled checks / manual AI-assisted work**, not a live 24/7 executor. No autonomous merge, production deploy, ACL changes, paid commitments, user/provider messaging or public publication.

---

## 8. Global geography, localization and market onboarding

### 8.1 Canonical world model

Global reach requires a maintained locality and language layer, not a country selector plus UK-specific data. Define and source:
- stable place ID; country ISO code; administrative levels; parent/child relationships; canonical URL slug; accepted alternate spellings, local names and transliterations;
- coordinate reference and uncertainty; viewport/bounds rules; time zone; languages; postal/address conventions where applicable;
- source, licence/terms, import revision, validation date, steward and retirement/merge rules;
- support for places where official administrative units differ from user-recognised neighbourhoods/villages; alias collisions and duplicate names must ask the user to clarify.

Reuse the existing place index as the canonical runtime authority and document the licensed source that populates it. Compare gazetteer/map sources and data licensing before selecting or merging any provider. Do not import the whole globe at once without a maintenance/rights strategy. Every location used in public URLs must resolve consistently in page routes, search, map and APIs.

### 8.2 Locale architecture

- Separate content locale, user preferred language, provider spoken/taught languages, market/country and currency; they are not interchangeable.
- Use locale-aware date/time/currency/number/address formatting with explicit timezone. Store money as integer minor units plus ISO currency; do not use floating-point prices or infer exchange conversion.
- Build locale URL strategy and fallback rules. Translate page content, metadata, menus, error states, legal/safety notices and emails in a controlled bundle. Do not mark up/hreflang translated variants until they are live, reciprocal, equivalent and meaningfully translated.
- Start with English and the minimum owner-approved launch language set based on the chosen pilot; select the next locales from actual user/supply research, not a universal guess.
- Search should support user locale, local-language aliases and common visitor phrasing. Use AI for ambiguous interpretation only if it returns canonical intent candidates for confirmation or deterministic validation.

### 8.3 Market dossier

Every country/launch region must have an approved dossier with:
- target users and top jobs-to-be-done, demand/source evidence, competing options and confidence;
- genuine consented provider/organiser supply by locality/category, freshness, coverage, requestability and contact route;
- geographic hierarchy/aliases/time zones/language/currency;
- data licenses, source terms, attribution, refresh/retention/removal;
- trust/qualification/verification policy for each enabled category;
- local legal review for employment/visitor work, tourism, privacy, consumers, payments, tax, moderation, safety and regulated areas;
- language-support coverage, moderation coverage, customer response expectations and escalation;
- UX, accessibility, SEO, route/canonical/sitemap/live-host checks;
- real end-to-end request/result test, performance/error baseline, monitoring and rollback;
- budget and unit-economics hypothesis, launch owner, stop/pivot conditions.

No dossier → no live launch claim. A market may be browsable but not indexable; a location may be represented but not have genuine supply; each status must be displayed honestly.

---

## 9. Twelve-month implementation programme

Months begin on owner acceptance. Multiple safe lanes may run in parallel, but dependent changes must be sequenced and exit gates cannot be waived for calendar speed.

### Month 1 — Establish authoritative state and stop integration drift

**Audit/R&D**
- Refresh current main SHA, enforced branch/ruleset/required checks, all PRs/issues, project sync target, production hostname/backend identity, environment variables (names only), route inventory, migrations, RLS/grants, source adapter statuses and historical exposed-secret risk.
- Build a PR dependency graph. Mark each candidate **integrate**, **port unique fix**, **superseded**, **blocked**, or **close after preserving unique work**. Reconcile the already merged #211/#220/#231 state rather than treating it as open.
- Resolve the contradiction in `docs/agents/STATUS.md` versus #254; update one canonical status file and link the evidence.
- Establish baseline data: eligible public records per category/country/locality, freshness, source rights, route/sitemap counts, telemetry events if any, users, useful-result rate, requests/responses/completions, reports, latency/errors, query/database cost and hosting budget. Use UNKNOWN when data cannot be obtained.

**Build**
- Create task envelopes for P0 findings in Sections 3 and 6, with one owner, dependencies, file scope and exact acceptance gates.
- Confirm a safe staging/disposable DB and a human owner for production, security, data and release.

**Exit:** one verified repository/environment snapshot, a ranked risk register, an integration graph, and a measured-or-unknown baseline. No security/production setting change is used to get unstuck.

### Month 2 — Repair SEO privacy, eligibility and live-host discovery

**Build**
- Select one route/sitemap implementation. Review #252 as the likely combined candidate against #247/#249 and preserve unique work before superseding alternatives.
- Implement a single canonical policy for route metadata, internal visibility, public APIs and sitemap URLs. Add freshness normalisation from #241 or an accepted equivalent.
- Fix the Life List registry mismatch across #253, #251, `PUBLIC_PATHS`, `PRIVATE_PATHS`, static assets and dynamic sitemap tests.
- Fix complete pagination and fail-closed behaviour for places and listing scans. A scan limit/error can never look like an empty-but-complete sitemap.
- Define the one production sitemap index endpoint and its child paths. Ensure robots points to it. Bring #251 live smoke checker onto the actual accepted policy and deployed hostname only after owner-approved deployment.
- Add tests for all privacy paths, canonical collisions, stale/no-provenance/fixture data, incomplete scans, redirects, wrong content type, shard byte/URL bounds and private URL leakage.

**Exit:** exact-head CI passes; all route/sitemap policy parity tests pass; complete scans are provable or fail closed; Life List is not public; live-host check is either verified pass or an explicit launch blocker with evidence.

### Month 3 — Close access-control and core data-contract gaps

**Build**
- Complete #164 ACL/RLS/default-privilege inventory in a disposable/authorised non-production environment; document the role/action matrix and all public/admin-client exceptions.
- Confirm auth gates, private routes and storage buckets; adversarially test anon, owner, unrelated user, provider, moderator and worker roles.
- Reconcile WorkOpportunity/last-checked freshness: choose a main-based PR chain between #241/#244/#259 and useful #197 work. Keep feed activation off.
- Trace a real eligible staging record through permitted read, normalisation, page/API, canonical discovery, action and visible truthful status. Repeat with private, demo, stale, expired, cancelled, blocked and failed-read records.

**Exit:** security review of access matrix; no unresolved critical/high release blocker in the tested scope; test database proof; one coherent canonical source/eligibility/normalisation contract; explicit human sign-off for any migration/grant proposal. Do not change hosted ACLs without approval.

### Month 4 — Global search front door, public APIs and useful no-result recovery

**Build**
- Audit/extend the current front door against issue #29: examples include “cleaner for short-term rental turnover”, “things to do here tonight”, “Spanish conversation practice”, “local guide”, “community garden”, and “casual work” with place/time constraints.
- Parse intent through canonical service/event/opportunity/place contracts. Ambiguous places/categories get user choice; unresolved intent stays visible rather than triggering a hidden matcher.
- Align public locality API, route metadata, results and sitemap candidate generation; add stable pagination/error/freshness/cache semantics and hosted verification before “LIVE” labels.
- Build no-result recovery: broader area (with explicit user confirmation), nearby supported categories, request/share need, contribute/claim a local record, or honest quiet state. No silent scope broadening.
- Add typed privacy-minimised funnel telemetry from #30 only after checking existing analytics and any required schema/RLS boundary.

**Exit:** tested intent journey for residents and travellers; source-grounded results; typed no-result reasons; accessibility/manual QA; no second discovery engine; privacy-reviewed telemetry contract.

### Month 5 — Cleaning / home services and short-term-rental turnover pilot

**Research**
- Select a pilot locality by documented search intent, property turnover evidence, genuine cleaner/host commitments, data rights, support capacity and local requirements. Airbnb is an example of short-term rentals, not a presumed partner or data licence.
- Interview providers and hosts/property managers. Determine whether a turnover task needs a quote, recurring schedule, urgent availability, laundry/linen, inspection, supplies or an entirely different workflow.

**Build**
- Complete provider onboarding/claiming, service-area coverage, service categories, current source timestamps, declared price basis and contact/quote requests.
- Implement a real request state machine with auth, consent, idempotency, spam limits, notification delivery state, block/report, cancellation and support escalation.
- Keep service-area semantics explicit; a profile residence never implies coverage. Keep private phone/email/precise address private by default.
- Show no booking confirmation unless the system actually reserves a provider/time. Show unknown availability when unknown.

**Exit:** opt-in verified cohort (target for research: 15–25 providers and 5–10 hosts/property managers, adjustable by evidence); successful end-to-end request/response in staging then approved pilot; RLS/abuse tests; support runbook; real outcomes measured. Cohort numbers are test targets, not expected achievements.

### Month 6 — Local guides, experiences and Spanish learning with locals

**Research**
- Compare South American candidate cities/neighbourhoods using actual visitor/resident demand, consented teacher/guide/experience supply, competition, seasonality, language support, trust/safety and regulation. Pick one based on evidence rather than fame.
- Interview teachers, conversation partners, guides, cultural organisations, students and travellers. Distinguish informal language exchange, paid tutoring, tours, classes and community events.

**Build**
- Listings support taught/spoken languages, level only when stated, lesson/experience format, duration, meeting mode, timezone, stated currency/price, cancellation policy, source and contact preference.
- Ensure profiles distinguish self-described skill from verified qualification. Use human-reviewed translation for consequential safety, price, cancellation and employment terms.
- Add consent, report/block, provider correction/removal and current status. Do not launch reviews/ratings until moderation, authenticity, appeals and deletion policies exist.

**Exit:** one evidence-selected market, real opted-in local supply and visitor participation, complete user journeys, verified source/rights, safe request flows and a market dossier. Do not claim a booking/payment system that is not integrated.

### Month 7 — Everyday local life and adjacent categories

- Activate events/culture/music, workshops, nature, community projects, volunteering, skill exchange, local businesses and work opportunities as distinct verticals with each category’s own evidence and risk contract.
- Add event source adapters only with terms, attribution, event identity, duplicate handling, cancellation/expiry, time-zone correctness and legal source activation.
- Keep opportunities separate: paid work, volunteering, unpaid training, expense reimbursement, stipend and unknown compensation are different facts. Never infer legal work eligibility, wages, accommodation or availability.
- Add source/provider dashboard for status edits, verification evidence, expiration and report handling.
- Establish sparse-village experience: local contributions and regional browsing without fabricating supply or indexing empty service pages. Add local partner/organisation onboarding and named steward.
- Research regulated/higher-risk categories (housing, childcare, medical/health, finance, legal advice) separately; do not activate them merely because the category graph permits them.

**Exit:** a small set of new categories passes policy, source, support, privacy, UX and end-to-end tests. Others remain visibly planned/disabled.

### Month 8 — Localisation, authoritative place coverage and market operations

- Inventory UK-centric assumptions, hard-coded currency/date/time/address/locale behavior and English-only strings (issue #31). Build locale-aware formatting, country/administrative models and alternate names without breaking canonical places.
- Research appropriate authoritative/licensed gazetteer sources, attribution and update terms. Add import/merge/alias/collision tests. Maintain locality ownership, provenance and a way for locals to correct the record.
- Select the next country/region only after market readiness; no “Australia live” or similar claim based on a route or fixture.
- Add translation workflows with human review for critical policy/safety copy; enable true hreflang/locale links only for equivalent live locale pages.
- Define low-bandwidth/resilient mobile behavior and manual place selection, because global usability includes users with slow networks, limited devices or denied location permissions.

**Exit:** one additional locale/market works end-to-end in test, including dates/currency/place names, route/canonical behavior, fallback language, support coverage, source rights and local steward; expansion dossier accepted.

### Month 9 — SEO and organic growth system for real utility

- Operate the unified SEO gate/sitemap on the verified production origin. Track index eligibility, excluded-by-reason, canonical selection, duplicate/soft 404s, stale pages and live sitemap shard size.
- Add #257 breadcrumb JSON-LD once route gating is stable. Test it against visible UI/hierarchy; then add category-specific schemas only after truthful field completeness and policy review.
- Introduce multilingual/country-specific URL and internal-link strategy; do not index query filters, unreviewed user-generated content, private route variations or thin translated pages.
- Use search data, Search Console and interviews to discover city/village category opportunities. Each opportunity needs source, timestamp, confidence, sample limitations, real supply evidence and an experiment decision.
- Build a controlled local-content workflow: local expert/partner evidence → AI-assisted draft → citations/fact check → human review → indexability gate → live monitoring. Never mass-publish generic city text or doorways.

**Exit:** current live SEO monitoring works; canonical/robots/sitemap/structured data checks are green; organic experiments track useful-result/request outcomes; no claim is made that search engines indexed pages without authoritative evidence.

### Month 10 — Deploy a grounded read-only AI companion

Only begin if #245 or an equivalent reviewed policy is integrated and necessary data rights/attestations exist.

- Provide place-scoped “Ask about this place / help me find…” interactions as a feature-flagged pilot.
- Retrieval happens server-side through eligible canonical sources; model receives only necessary fields. It cites sources and dates, states uncertainty, never invents prices/availability/ratings or recommends nonexistent providers.
- Test prompt injection in listing text, private/cross-place leakage, malicious instructions, model hallucination, stale records, conflicting sources, empty results, multilingual queries, personal-data redaction, output-schema failure and cost/latency.
- Enforce timeout/context/output/rate/cost caps, deterministic fallback, audit log minimisation and kill switch. User-facing AI has no database write, contact, booking, payment, publication or unrestricted external-action tool.
- Keep the assistant off for categories/markets without adequate source evidence and local support.

**Exit:** independently reviewed eval report, privacy/security review, source/citation fidelity threshold, cost/latency budget, failure handling and rollout/rollback plan. If evidence/rights are absent, the correct exit is “remain disabled and continue research.”

### Month 11 — Reliability, scale tests, operations and supervised agent runtime

- Establish real pilot SLO baselines. Proposed gates to ratify from evidence: 99.5% monthly availability during controlled pilot; public read p95 below 500 ms at declared workload where appropriate; server error rate below 1%; no unresolved critical/high release security findings. These are design targets, not current measurements.
- Load/soak test the actual workload: location resolution, dense locality, sparse village, large hierarchies, sitemap generation, many simultaneous searches, popular-market hotspots, ingestion, stale cache, auth, report/request writes and AI requests.
- Use query plans, indexes, cursor pagination, bounded batch/cache, CDN/SSR measurements, rate limits and queueing to address measured bottlenecks; never remove permission/evidence checks to improve speed.
- Reconcile #74/#100/#116 and perform #117’s adversarial hosted *non-production* executor tests. Do not enable persistent dispatch until identities, project scope, schema/RLS, lease fencing, cancellation, retry caps, budgets and kill switch are proven.
- Verify backup restore, rollback, incident response, log redaction, dependency scanning, secret rotation, support staffing and cost budgets.
- Confirm the Bun v2 lockfile and Cloudflare/Nitro/Lovable deployment runtime compatibility before accepting #260.

**Exit:** workload and cost report, recovery drill, security sign-off, source/SLO alerts, and proof of one bounded scheduled task/heartbeat on a confirmed non-production environment. No autonomous production executor or merge.

### Month 12 — Launch review and the next market decision

- Use staged rollout: staff/internal → invited provider/customer cohort → constrained public pilot → broader locality/category only after measured gates pass.
- For each market, publish only supported live categories and clear states. Run real smoke requests for cleaning, local learning/guide, events or opportunity paths relevant to that cohort.
- Review qualified result rate, provider response/completion, repeat supply, reports/cancellations, stale-source rate, user satisfaction, SEO quality, accessibility, latency, support cost and contribution margin.
- Decide **build / pause / stop / pivot / explore** for each market-category pair. Remove categories that cannot maintain truthful supply, safety or operational support.
- Add the next market only when the current onboarding playbook is repeatable and local supply/support/legal gates are met.

**Exit:** written approval by product, engineering, security/privacy, data/source stewardship, support and market owner; launch metrics and incidents reviewed; a measured Year Two roadmap. The valid outcome may be a few highly useful markets plus a proven global expansion process—not a misleading claim that every village is fully populated.

---

## 10. Continuous workstreams and exact acceptance standards

### A. User journeys
- Resident: location chosen manually or by consent → everyday intent → eligible options → source/freshness → action/request → real response → outcome/correction.
- Host/property manager: task details → verified coverage → quote → provider response → agreed state (only if represented) → issue/report/resolution.
- Cleaner/worker: profile/claim → service/work scope → clear compensation/terms → request/application → response → safety/report/support.
- Traveller: selected city and dates/timezone → real guide/experience/language partner → clear price/terms/language → consented enquiry → meeting safety and follow-up.
- Community member: need/offer/project/event → explicit visibility and consent → canonical discovery → contact/join → feedback and moderation.
Every journey must test anonymous/signed-in states, empty/stale/error/unauthorised results, duplicate submission and mobile accessibility.

### B. Real-world data contracts
All public records need defined schema/version, canonical identity, source, rights/consent, last-checked/update timestamp when source-derived, visibility/publication state, category/place links, freshness expiry, correction/removal path and moderation policy. Use reason codes for rejects/holds. Staging never counts as public supply.

### C. Supply growth and villages
A locality page may exist even when sparse; indexability is separate from user access. Use the same canonical eligibility gate for link exposure/sitemap/indexing. Show source coverage limitations and offer contribution/nearby alternatives. Detect supply gaps from actual eligible records and demand evidence, then create provider-acquisition tasks requiring human outreach approval. No automatic scraping or claims based solely on missing data.

### D. Reliability and global scale
Before scale claims, model read/write volume, source refresh schedules, cache hit rates, cold starts, geographic queries, payload size, DB pool usage, shard generation, model tokens/cost and support load. Run 10×/100× scenarios as simulations after a measured baseline, and distinguish extrapolation from actual load tests. Define capacity per service/dependency and fail-safe behavior under rate limits or outages.

### E. Privacy-respecting analytics
Instrument the complete funnel with minimised data. Use aggregate locality/category rather than exact user coordinates where possible. Set retention limits, role-based dashboard access, user consent and deletion rules. Do not build ad-tech identity graphs or optimise vanity engagement.

### F. Accessibility and trust
Human QA with keyboard and screen reader, contrast, 200% zoom, reduced motion, mobile 375/390 and desktop 1280/1440 layouts, focus restore, forms, status announcements and target size. Define verification semantics by category and support appeals, correction, removal and abuse reporting.

### G. Commercialization
Research subscriptions, qualified leads, transparent booking commissions, organisational tools and clearly labelled sponsored placement. Historic prices are hypotheses. Do not enable live payment/outreach without explicit owner decision, jurisdiction/terms review, refund/dispute process, ledger reconciliation, chargeback handling, cost model and security check. Paid prominence must not quietly override evidence/relevance.

---

## 11. Proposed metrics and release gates

These are proposed gates that must be ratified after Month 1 baseline. They are not claims of current state.

| Dimension | Metric | Gate or rule |
|---|---|---|
| Core discovery | Intent → eligible result rate; time to first useful result; no-result recovery | Baseline by category/market; every no-result has a truthful reason and safe next action. |
| Real-world conversion | Search → detail → request → provider response → declared completion | Instrument only supported durable states; report each transition and failure reason separately. |
| Data integrity | Public record provenance/freshness/visibility/rights status | 100% of public records have the required publication/visibility semantics and removal path; source-derived records show last-checked evidence or stay gated. |
| SEO | Route/sitemap parity; private URL leakage; crawl status; duplicate/canonical conflicts | One eligibility policy; zero private/demo/unsupported URLs in public sitemaps; incomplete enumeration fails closed. |
| SEO host validation | HTTP status, content type, canonical, robots and child-sitemap checks | Must run on deployed origin after authorised deployment; repository tests alone do not satisfy. |
| Accessibility | Manual keyboard/screen-reader/responsive review | Required before public pilot for each primary flow; record evidence and unresolved exceptions. |
| Security/privacy | RLS/grant matrix, private-path isolation, secrets and source-data rights | Zero unresolved critical/high release findings unless an owner records explicit risk acceptance/expiry; no unauthorised hosted mutations. |
| Reliability | Availability, p95/p99 latency, error rate, recovery | Set by measured workload; proposals are 99.5% pilot availability, p95 <500 ms where appropriate, errors <1%; prove through actual monitoring/load. |
| AI integrity | Citation precision, grounded answers, cross-place leakage, refusal/no-result, latency/cost | Establish an adversarial golden set; no launch without thresholds, budget, privacy review, feature flag and kill switch. |
| Supply liquidity | Eligible providers/category/locality, response/freshness/coverage | Distinguish current eligible supply from all real-world supply; unknown is not zero in the world. |
| Economics | Cost per useful outcome, support minutes, provider onboarding, CAC/retention/revenue | No monetisation expansion without measured unit economics and provider/user willingness-to-pay evidence. |
| Agent operations | Durable queue, lease/heartbeat, stale task, duplicate dispatch, blocked work, audit trail and spend | No 24/7 claim without real scheduled non-production task/heartbeat, kill switch, bounded retries and human escalation. |

Do not optimise for page counts, commits, time in app, raw model calls or agent activity. A closed loop to a safe, useful offline outcome is success.

---

## 12. Grok execution protocol

Before every task:
1. Read this plan, the companion prompt #248, `README.md`, `roadmap.md`, `AGENTS.md`, `docs/agents/README.md`, current `docs/agents/STATUS.md`, relevant ADRs and the exact issue/PR history.
2. Fetch current default-branch SHA, PR bases/heads, exact check runs, changed paths, reviews and comments. Do not use old head SHA as current proof.
3. Check active tasks, branch ownership and conflicting paths before claiming work. Follow claim/lease/handoff policy. If another agent is editing the same path, coordinate or work another lane.
4. Produce a bounded task contract: problem, evidence, objective, scope in/out, dependencies, risks, acceptance criteria, tests, rollback, security/privacy/SEO effects and human gates.
5. Research current external facts/rules/provider terms when material; cite source and date. Distinguish observed facts, hypotheses, proposed metrics and UNKNOWN. Avoid hallucinated market sizes, search volumes and supplier availability.
6. Use a non-main branch; make the smallest reversible change. Do not rebase-force or rewrite another agent’s history. Do not edit via Lovable until its sync target is confirmed as the intended non-main branch.
7. Test in increasing order: unit/adversarial → integration → type/lint/test/build → disposable DB/RLS when relevant → browser/a11y → hosted non-production → human-approved live check.
8. Review the final diff for secrets, untrusted content, authentication, data rights, private route/sitemap leakage, canonical discovery duplication, pagination/truncation, query cost, stale cache, mobile/accessibility and rollback.
9. Open/update a reviewable PR with exact SHA, CI links, manual evidence, skipped checks, known limits, dependency and risk. Update the canonical status/handoff.
10. Stop and escalate on production writes, schema/RLS/grant changes, credentials, billing, external outreach, ambiguous legal semantics, data-rights uncertainty, conflicting branch lineage or repeated failure. After three materially similar failures, diagnose instead of retrying endlessly.

**Never allowed without explicit human approval:** merging to main, deployment, production data writes, live-feed activation, credentials or permissions, hosted RLS/grant/default-ACL changes, destructive migrations, paid spend/autopay, external user/provider communication at scale, legal/financial commitments, public partnership claims, mass page publishing, or changing the human-gate policy.

AI can research and recommend an action; deterministic policy and authenticated server code must enforce it; a human must approve high-consequence or irreversible actions. Do not confuse model confidence with evidence.

---

## 13. First ten implementation tasks after this plan is accepted

1. **Refresh canonical reality:** verify main SHA, ruleset/required checks, Lovable sync branch, deployed hostname/backend project, secret scan and status-doc consistency. Do not touch production to accomplish this.
2. **Create a PR dependency graph:** current-main candidates, merged UI #211/#220/#231, SEO #247/#249/#251/#252/#253/#257, map #238/#242/#261, WorkOpportunity #197/#241/#244/#259, security #260 and public API issue #111.
3. **Run an independent security/data access audit:** issue #164 matrix; admin-client public reads; user/private route and storage policies; prove with a disposable environment.
4. **Choose the single SEO indexability/sitemap implementation:** compare #252 with #247/#249, keep best unique tests, paginate every source scan, align `last_checked_at`, and close/supersede alternatives after preserving fixes.
5. **Fix public-route policy parity:** Life List private; one canonical route registry; checker, static and dynamic sitemaps, structured data and internal links all derive from the same rules.
6. **Make live SEO operational:** correct root/API/static hosting precedence; configure #251 smoke after merge/review; perform approved GET-only production checks and capture results.
7. **Integrate map scope fixes:** verify final server viewport guard in #242; apply #261 or equivalent fail-closed >400-child and antimeridian solution; preserve #238's cached-failure, cancellation and page-limit UX without a duplicate branch.
8. **Complete data freshness/work chain:** merge/port one reviewed #241/#244/#259 sequence; real source rights/persistence/staging gates remain closed until approvals.
9. **Build the first complete market flow:** choose cleaning/turnover locale from evidence and connect onboarding → real eligible listing → scoped search → enquiry → provider response → report/support; do not launch payments unless explicitly approved.
10. **Prove and pilot next vertical plus AI boundary:** select a South American Spanish/guide market by evidence, then launch one grounded read-only assistant pilot only after rights/attestations/evaluations/budget/kill switch pass; separately reconcile the durable agent control plane before any 24/7 claim.

If a task is blocked, proceed with the next safe non-overlapping item and record the blocker owner/evidence. Never compensate for blocked integration by creating another competing implementation.

---

## 14. What “global reach” means in a verifiable way

The network is globally ready when a repeatable process can:
- represent a place using authoritative, maintained, licensed canonical geography;
- understand the resident’s or traveller’s real intent in their chosen language;
- retrieve only genuine eligible information within the selected locality/scope;
- distinguish verified facts, reported facts, unknowns and stale data;
- show an accessible, fast and localised experience on an ordinary mobile connection;
- enable only actions the backend actually supports;
- onboard local providers/organisations with clear consent, terms and support;
- discover supply gaps using demand evidence without claiming missing records mean no supply exists;
- publish SEO pages only when they are useful and grounded, with correct canonicals, language links, structured data and sitemaps;
- run AI assistants/engineering agents with citations, least privilege, evals, budgets, durable operational proof and human gates;
- measure successful real-life outcomes, provider participation, trust, cost and reliability;
- recover safely from bad data, source outages, abuse, failed deploys and unsupported markets;
- repeat the same process for the next village, town, city and country.

A village with little recorded data is not a failed market and must not be filled with fabricated listings. It should still get an honest place page, relevant context, a route to contribute or request something, and an explicit option to widen the area. A city with thousands of listings must get pagination, source freshness, abuse defenses and robust query budgets rather than a huge unbounded scan. Both rely on the same canonical rules; only the density and operational configuration differ.

**Year-one target:** a demonstrably safe, evidence-rich global foundation; reconciled SEO and frontend/backend integration; several validated real user journeys in a small number of chosen markets; measurable search-to-real-world outcomes; and a supervised AI operating model that can be expanded responsibly. Global coverage is a continuous programme, not a one-time launch toggle.

---

## 15. Definition of Done for this programme revision

This plan is considered ready for owner/Grok execution when:
- current repository/environment truth has been refreshed rather than copied from old status text;
- competing PRs are reconciled into a dependency-aware sequence;
- P0 access-control and scope risks have owners and test plans;
- SEO route, sitemap, robots and live smoke policies agree and are tested on the real deployed host;
- a first local-service end-to-end journey completes truthfully with real permitted data;
- the chosen Spanish-learning/guide market is supported by research and opt-in supply;
- international place/locale data is rights-cleared and source-maintained;
- AI retrieval is grounded, read-only, evaluated and cost-controlled before user exposure;
- the agent control plane is called live only after an authenticated durable non-production proof;
- launch metrics and market dossiers support every live market/category claim;
- every production/security/financial/legal decision still has its explicit human approval.

Until each condition is evidenced, report it as **not yet verified**, **blocked**, or **not live**—not complete.
