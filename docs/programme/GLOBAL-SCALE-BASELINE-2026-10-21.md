# Global Scale Mission — Verified Baseline

**Snapshot date:** 2026-10-21  
**Repository:** `mattleask373-rgb/life-lived-network`  
**Branch reviewed:** `main`  
**Reviewed main SHA:** `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`  
**Evidence boundary:** GitHub repository contents, repository metadata, branch ruleset, and Actions run metadata. This is not a production penetration test, database inspection, live-site crawl, or load test.

## 1. Executive assessment

Real World Atlas is an existing TanStack Start/React application for discovering people, places, services, work opportunities, and experiences. It has a real domain layer, route structure, Supabase integration, database migrations, SEO helpers, a meaningful test suite, and repository-resident agent governance documentation. Preserve this investment; do not replace the stack as a first move.

The current codebase is **not yet evidenced as a globally scalable production platform**. No verified DAU, peak request rate, p95/p99 latency, database size, availability history, infrastructure cost, Search Console data, or retention/conversion baseline was available in this repository inspection. The aspirational billion-DAU target must remain a planning scenario, not a capacity claim.

The initial queue inventory, captured before this baseline PR was opened, returned **93 open PRs**, including **53 drafts**, **58 not updated in the preceding seven days**, and **13 targeting a branch other than `main`**. PR #254 adds this baseline document as another open PR until it is closed or merged. The queue remains a material merge-conflict, duplicated-effort, review-latency, and verification-cost risk. Prefer triaging and independently validating existing work over creating more overlapping branches.

### Verified repository facts

- Recursive tree: 374 paths, no truncation.
- 26 route source files under `src/routes/`.
- 50 test/spec files matching the repository tree search.
- 30 SQL migration files under `supabase/migrations/`.
- One workflow exists on `main`: `.github/workflows/verify.yml`.
- Latest observed `main` SHA: `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`.
- The corresponding GitHub Actions `Verify` run completed successfully at 2026-10-21 09:44 UTC: [run](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39579239926).
- The main-branch ruleset `living World - protect main` is **active**. It requires a pull request, one approving review, approval of the latest push, resolved review threads, and the `verify` status check. The repository denies deletion and non-fast-forward updates, with no bypass actors listed.
- `AGENTS.md` and `docs/agents/README.md` explicitly prohibit autonomous merges to `main`, force-pushes, and approval of an agent's own work.
- The deployed origin `https://life-lived-network.lovable.app` could not be fetched by the available browser tool during this review. This does **not** prove the site is down; live HTTP behavior remains unverified.
- The agent status file `docs/agents/STATUS.md` records an earlier main SHA and says the ruleset was disabled. Current GitHub metadata contradicts that ruleset statement; refresh the status record rather than acting on it.

## 2. Architecture map

| Layer | Verified implementation | Current assessment |
|---|---|---|
| Browser UI | React 19, TanStack Router/Start, reusable UI in `src/components/`, route modules in `src/routes/` | Meaningful app exists; responsive, accessibility, and real-device behavior still need automated and manual evidence. |
| Server/runtime | `src/server.ts`, `vite.config.ts`, TanStack Start server entry; the Lovable Vite config documents Nitro's default Cloudflare target | Server-side rendering and error normalization are present in code. Actual deployed runtime, regions, caching, and limits are not verified. |
| Domain logic | `src/lib/`: places, locality, listings, services/taxonomy, supply engine, matching, journey, road trip, needs, connections, moderation, memories, ingestion | Preserve the canonical domain layer. `src/lib/supply-engine.ts` is declared the single possibility/discovery authority. |
| Server functions | `src/lib/*.functions.ts`, including locality, world/listings, capability, connection, needs, moderation, memories, ingest, draft assistance | Trace every callable function for auth, authorization, validation, quotas, and safe error contracts before launch. |
| Authentication | `src/integrations/supabase/auth-middleware.ts`, `src/integrations/supabase/auth-attacher.ts`, `src/hooks/use-session.ts` | Supabase token claim validation is implemented. Complete end-to-end route and resource authorization assurance still requires review and tests. |
| Database | Supabase Postgres/Auth/RLS; 30 migration files; generated types at `src/integrations/supabase/types.ts` | Migration history is the available schema evidence. `drizzle/schema.ts` is intentionally blank, so it is not the canonical schema source. Live indexes, policies, data volume, slow queries, backups, and PITR were not queried. |
| Public data access | `src/lib/supabase-public.server.ts` uses publishable-key access and documents anonymous RLS behavior; `src/integrations/supabase/client.server.ts` creates a server-only service-role client | The privileged client bypasses RLS by design. Audit every import and call site; keep it server-only and narrowly scoped. |
| SEO | `src/lib/seo.ts`, `src/routes/robots[.]txt.ts`, `src/routes/sitemap[.]xml.ts`, `src/routes/api/public/sitemap*.ts`; tests in `src/lib/seo.test.ts` and `src/lib/sitemap-privacy.test.ts` | Canonical, public/private metadata helpers and privacy-focused sitemap tests exist. Dynamic locality/service sitemap integration is in draft PRs, not established on current `main`. |
| AI capability | `src/lib/draft-assist.functions.ts`, `src/lib/draft-assist.server.ts`, `src/lib/ai/run-id.ts`, `@ai-sdk/openai` and `ai` dependencies | A bounded draft-assistance feature exists. The “Ask this place” behavior is documented as an unavailable placeholder, not an active general-purpose assistant. A full autonomous agent runtime is not verified on `main`. |
| Ingestion | `src/lib/ingest/`, `src/lib/ingest.functions.ts`, fixture source and Ticketmaster adapter | An ingestion seam and adapters exist; external source entitlements, quotas, freshness monitoring, retry behavior, and production readiness need source-by-source validation. |
| CI | `.github/workflows/verify.yml`: frozen Bun install, lint, tests, build on push/PR | Latest observed main run passed. Current workflow has no scheduled production smoke test, dedicated security scanning, or dedicated locale/SEO regression job. Draft PRs propose CI concurrency hardening and live SEO checks. |
| Agent process | `docs/agents/`, `docs/adr/`, `docs/programme/MASTER-PROGRAMME-SPECIFICATION.md`, `AGENTS.md` | Governance concepts and invariants are documented. This inspection does not establish a continuously running orchestrator, 24/7 worker availability, or complete production agent telemetry. |
| Internationalization | No locale/message/i18n directories were found in the 374-path tree search | Locale catalogs, locale-aware routes, reciprocal `hreflang`, and translation review workflow are not evidenced by this inventory. |

## 3. Feature inventory

Status refers to code/document evidence on the reviewed branch, not a product claim.

| Capability | Status | Evidence / gap |
|---|---|---|
| Living map and place discovery | Implemented in code; runtime behavior not independently verified | `src/routes/index.tsx`, `src/components/living-map.tsx`, `src/lib/places.ts`, `src/lib/world.functions.ts` |
| Locality and service pages | Route code present | `src/routes/$country.$place.index.tsx`, `src/routes/$country.$place.$service.tsx`; SEO sitemap discovery is still being worked on in draft PRs. |
| Journey / road-trip flows | Routes and domain modules present | `src/routes/journey.tsx`, `src/routes/road-trip.tsx`, `src/lib/journey-engine.ts`, `src/lib/road-trip.ts` |
| Life list / place memories | UI and domain code present; privacy policy is explicit | `src/routes/life-list.tsx`, `src/routes/memories.tsx`, `src/lib/memories.ts`, `drizzle/migrations/0000_place_memories.sql`; memories are intended to be private and excluded from discovery. |
| Needs, connections and moderation | Modules, server functions and tests present | `src/lib/needs.functions.ts`, `src/lib/connection.functions.ts`, `src/lib/moderation.functions.ts` |
| AI draft helper | Bounded feature present; provider/deployment behavior not live-tested | `src/lib/draft-assist.server.ts`, `src/lib/draft-assist.functions.ts`; code comments describe a signed-in, schema-bounded flow that does not auto-save a draft. |
| Place Q&A agent | Not active / explicitly unavailable in the inspected status docs | Placeholder is not evidence of an active AI endpoint. |
| Dynamic locality/service sitemaps | Not merged on reviewed `main` | Draft PRs #247 and #249 propose related indexability and sitemap changes; align these rather than merge overlapping implementations blindly. |
| Scheduled published-SEO checks | Not on `main` | Draft PR #251 proposes a daily live smoke workflow. |
| CI run deduplication and minimum token permissions | Not on `main` | Draft PR #250 proposes concurrency cancellation and `contents: read`. |
| Internationalized UI and SEO | Not evidenced | No locale catalogs or `hreflang` implementation found in the tree. |
| Product analytics and user-feedback dashboard | Not evidenced as a deployed end-to-end system | Define the privacy-safe event contract, consent, retention, aggregation and dashboards before collecting broad behavioral data. |
| Production SLOs, load tests, DR drills and cost-per-active-user | Unverified | Requires runtime, hosting, database, billing and analytics evidence. |

## 4. Technical SEO audit

### What is present

- `src/lib/seo.ts` centralizes `publicPage()`, `privatePage()`, canonical URL construction, `robotsTxt()`, XML sitemap generation, and fixed public/private path lists.
- Public page metadata emits title, description, Open Graph metadata, `robots=index, follow`, and canonical links. Private page metadata emits `noindex, nofollow` and no canonical URL.
- `public/robots.txt` and dynamic `/robots.txt` disallow known private/internal routes. The code correctly documents that robots directives are crawler policy, not access control.
- Sitemap tests verify canonical URLs, private-path exclusion, consistency between generated and static robots text, and a fixed list of public screens.
- Locality and service route modules build page metadata and contain “quiet page” handling rather than implying supply where none is recorded.

### Highest-priority SEO gaps

1. The reviewed static `public/sitemap.xml` lists only six fixed public routes. It does not list locality/service URLs, even though locality and service page routes exist in the app.
2. `src/lib/service-page.ts` has its own `servicePageIndexable()` rule and explicitly notes that the shared canonical indexability gate is still a backend dependency. Search metadata and sitemap eligibility must make the same decision from the same evidence.
3. The current sitemap endpoints expose a fixed-screen list. Draft PRs #247 and #249 propose a common indexability gate and bounded locality/service child sitemaps. Review for duplicated logic, bounded-query correctness, complete scans, RLS use, privacy and route parity before accepting.
4. Static and dynamic sitemap/robots output can diverge unless regression-tested against the configured site origin and the actual deployment path.
5. No locale catalogs, `hreflang` relationships, or localized SEO pipeline were found.
6. Public-origin HTTP smoke testing, canonical/title checks across real HTML, structured-data crawl validation, Search Console index coverage, and Core Web Vitals are not verified in this inspection.
7. Robots exclusions must never be treated as protecting private pages. All sensitive route data requires server-side authorization regardless of crawl rules.

### SEO acceptance targets

- Every intended public landing URL returns the expected status and server-rendered primary content.
- Every public indexable page has one stable canonical URL, an accurate title/description, and appropriate robots directives.
- Sitemap URLs are absolute, canonical, public, deduplicated, and pass the same eligibility predicate used by page metadata.
- Incomplete/failed source scans fail closed and do not generate guessed URLs.
- Private, blocked, reported, demo-only, empty and ineligible pages are excluded from indexable sitemaps and keep appropriate authorization boundaries.
- Scheduled smoke checks detect status, content-type, sitemap, robots, canonical and indexability regressions, and create useful failure output without claiming that Google indexed a URL.

## 5. Security and reliability risks (ordered)

| Priority | Risk / unknown | Evidence | Required mitigation |
|---|---|---|---|
| P0 | Existing PR queue can hide urgent fixes and create conflicting changes | 93 open PRs; 53 drafts; 58 not updated in 7 days; 13 target non-main branches | Triage, deduplicate, label by risk/owner, close explicitly superseded PRs only after checking unique commits, and define a merge/review cadence. Do not bulk-close blindly. |
| P1 | Service-role Supabase client bypasses RLS | `src/integrations/supabase/client.server.ts` intentionally creates it | Audit every import/call site; prohibit route/client-bundle leakage; add static/test enforcement for server-only use and resource-scoped authorization tests. |
| P1 | Security/dependency scanning absent from the only workflow | `.github/workflows/verify.yml` has install/lint/test/build only | Add dependency and secret scanning with least-privilege tokens; use supported scanners with pinned actions and documented triage. |
| P1 | SEO indexability and sitemaps are not yet one canonical decision | `src/lib/service-page.ts` notes the shared gate remains a dependency; PRs #247/#249 are draft | Merge a single tested gate and sitemaps after independent review; avoid listing public-looking but empty/ineligible routes. |
| P1 | Actual production posture is unknown | Live origin did not load via available browser tool; no hosting/DB/billing telemetry was provided | Confirm runtime/deployment, logs, database configuration, backups/PITR, secrets storage, alert routing and incident owner. |
| P1 | Production data boundaries depend on Supabase RLS and server function checks | Supabase client and migrations exist; live policies not queried | Test owner/resource/role cases end-to-end, including cross-user and anonymous attempts. Review `SECURITY DEFINER` functions, grants and search paths. |
| P2 | Single-region/database and provider failure limits are unknown | Supabase and a Nitro/Cloudflare-targeted build are visible; deployed topology is not | Baseline query latency and connection pressure, set SLOs, load-test realistic journeys, document recovery goals, and scale only at measured thresholds. |
| P2 | Locale support is not evidenced | No locale/message folders found | Introduce one locale first, locale-aware formatting/routing and translation QA before a multi-market launch. |
| P2 | User metrics and feedback evidence are not established in repository | No verified live funnel, retention, feedback or Search Console data | Ship privacy-safe, consent-aware events and opt-in feedback with aggregation and retention limits; distinguish measured users from synthetic tests. |
| P2 | AI execution may exceed safe permissions if agent infrastructure grows faster than governance | Agent governance docs exist; full runtime/telemetry not verified | Keep agent jobs isolated and bounded; read-only by default, budgets and audit logs, evaluation sets, human approval for migrations/secrets/production writes/merges. |

No secret was observed in the inspected `.env.example` (it contains placeholders). This was not a full historical secret scan, and it does not establish that external secret stores or deployment settings are correct.

## 6. Backend and capacity assessment

### Current backend shape

The best-supported description is a **TypeScript monolith/server-rendered application backed by Supabase Postgres and Supabase Auth**, with domain logic in `src/lib/`, typed server functions, and a limited set of provider adapters. That is an appropriate starting point; a microservice rewrite is not justified by the current evidence.

Not verified: actual traffic, database table sizes, SQL query plans, index health, connection-pool limits, caching behavior, queue throughput, regional deployment, availability, backup restore, disaster recovery time, or cost per active user.

### Illustrative traffic model — planning, not a benchmark

Assumptions, solely to make the scale discussion calculable:

- 20 dynamic application/API requests per DAU per day, excluding static assets and most media delivery.
- Peak request rate is 10× the daily average.
- Peak concurrent users equal 5% of DAU.
- 10% of dynamic requests are writes (illustrative read/write ratio 9:1).
- 1 KB of new persistent application data per DAU per day, excluding indexes, replicas, backups, logs and media.
- Average response payload of 20 KB per dynamic request, excluding large media.
- Separate AI envelope of 0.1 model/agent calls per DAU per day (for example, one call per ten DAU daily); it is not assumed to be part of every request.
- Every number is an aggregate planning assumption; cache hit rate, session behavior, endpoint mix, bots, media, third-party source polling and AI request patterns can materially change it.

| DAU scenario | Dynamic requests/day | Average RPS | Illustrative peak RPS (10×) | Concurrent users at 5% | Write ops/day (10%) | New raw app data/day (1 KB/DAU) | Egress/day (20 KB/request) | AI calls/day (0.1/DAU) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 10,000 | 200,000 | 2.3 | 23 | 500 | 20,000 | 10 MB | 4 GB | 1,000 |
| 100,000 | 2,000,000 | 23 | 231 | 5,000 | 200,000 | 100 MB | 40 GB | 10,000 |
| 1 million | 20,000,000 | 231 | 2,315 | 50,000 | 2 million | 1 GB | 400 GB | 100,000 |
| 10 million | 200,000,000 | 2,315 | 23,148 | 500,000 | 20 million | 10 GB | 4 TB | 1 million |
| 100 million | 2,000,000,000 | 23,148 | 231,481 | 5 million | 200 million | 100 GB | 40 TB | 10 million |
| 1 billion | 20,000,000,000 | 231,481 | 2,314,815 | 50 million | 2 billion | 1 TB | 400 TB | 100 million |

These volumes are intentionally simple order-of-magnitude envelopes. They are not forecasts, benchmarks, budgets, or a sizing recommendation. Media delivery, index/replica/backup storage, bot traffic, retries, source ingestion, external API quotas and inference token usage are excluded or simplified and could dominate actual cost.

At the illustrative billion-DAU tier, even 20 requests per person per day is 20 billion requests/day. That implies distributed edge delivery, aggressive cacheability for public content, sharded/partitioned data where justified, regional traffic management and significant operational ownership. It does **not** imply the current app is remotely validated for this load.
### Evidence-triggered scaling path

- **10k DAU:** retain the monolith; establish request metrics, query budgets, connection-pool visibility, basic response caching for public routes, rate limits, backups and a repeatable k6/Artillery load test.
- **100k DAU:** use traces and slow-query data to add/adjust indexes, cache hot public reads, queue expensive ingestion, enforce per-provider quotas, test traffic spikes and identify workload-specific saturation.
- **1M DAU:** add managed queue/workers if synchronous request paths or ingestion backlogs demonstrably saturate; use CDN/edge caching and measured read replicas only where consistency and provider capabilities permit.
- **10M DAU:** model tenant/key access paths, table growth, hot partitions and regional latency. Introduce partitioning and service separation only when traces, lock contention or independent scaling needs justify them.
- **100M DAU:** plan active regional traffic management, regional read locality, data replication/consistency trade-offs, formal capacity reviews and rehearsed regional recovery.
- **1B DAU:** requires a separate architecture/business case grounded in observed workloads, capital, staffing, product-market fit, abuse response, legal operations, multi-region data strategy and large-scale disaster recovery. Do not promise capacity before sustained benchmark evidence.

At every tier, publish p50/p95/p99 latency, error rate, throughput, saturation, queue delay, database CPU/connections, cache hit rate, cost/request, cost/DAU and recovery test results. Establish numerical SLOs only after baselining current production behavior.

## 7. AI-agent opportunity and guardrails

### Existing foundation

- Domain-specific AI draft assistance is present in `src/lib/draft-assist.functions.ts` and `src/lib/draft-assist.server.ts`.
- Agent lifecycle, lease/heartbeat, handoff, invariants and specialist lanes are described in `docs/agents/`.
- The separate repository `real-world-atlas-agent-orchestration` currently has only one README file in its tree; it is not evidence of a working deployed orchestrator.
- Scheduled, continuously running workers, tool audit logs, model-evaluation reports, budgets and live autonomous operations were not independently verified.

### Recommended rollout

1. **Repository/CI agent:** read repository context, open a small branch/PR, run existing checks, produce a structured report. No merge or secret access.
2. **SEO agent:** run local and published-origin checks, compare sitemap/indexability rules, propose diffs and regression tests; no autonomous publication.
3. **Security/reliability agent:** run supported dependency/secret scanners, inspect auth/RLS call sites, attach evidence, and escalate high-severity items. No security-permission changes or production writes.
4. **Feedback/analytics agent:** only process consented, minimized and access-controlled feedback; output aggregate themes with sample size and confidence, clearly distinguish anecdote from measured behavior.
5. **Localization agent:** generate candidate translations and test cases; human review for legal, cultural, safety and high-impact copy.
6. **Growth/experimentation agent:** propose falsifiable experiments from consented analytics; never fabricate demand or treat generated personas as user research.

Every agent needs narrow permissions, bounded runtime/retries/token budget, model/prompt versions, structured outputs, idempotent task IDs, task leases/fencing, safe retry and dead-letter handling, audit trails, prompt-injection defenses, evaluation fixtures, false-positive tracking and an explicit human-approval policy. Completion must be measured by accepted output, regression rate, cost per useful task and verified time saved—not task count.

## 8. International and global-market readiness

**Current readiness: foundational only; not verified ready for a multi-market launch.**

Strengths: country/place hierarchy, timezone and currency fields are referenced in the data model; the route design has a country segment, and shared locality/service taxonomy can support future markets.

Gaps: no i18n message catalog or locale routing was found; no reciprocal `hreflang`/localized canonical implementation was evidenced; translated transactional emails, consent and retention by market, local payment/accessibility verification, and human translation review remain unverified. The service route currently defaults its country segment to `gb` when the record does not supply one—this should be made an explicit, validated data contract before expanding countries.

Launch one evidence-backed pilot market at a time. For each market score: real inventory density, demand, acquisition cost, activation/retention evidence, language quality, payment feasibility, legal/privacy obligations, moderation coverage, operating hours, and support cost. Do not generate international SEO pages for a language or place where the product cannot deliver a truthful, useful experience.

## 9. Ten highest-impact improvements

1. **Stabilize the PR/agent queue.** Triage overlapping/stale branches and target branches before generating more code. Outcome: fewer conflicting implementations, clearer ownership and faster review.
2. **Land CI queue hardening with minimal token permissions.** Existing draft #250 touches `.github/workflows/verify.yml`; verify run cancellation and required checks before accepting.
3. **Make indexability a single shared policy and build truthful dynamic sitemaps.** Coordinate drafts #247/#249; align route head metadata, locality/service content rules and child sitemap eligibility.
4. **Add published-origin SEO smoke tests.** Draft #251 proposes a scheduled workflow. Verify status, content type, robots, sitemap index, canonical and expected HTML from the actual origin.
5. **Add dedicated supply-chain/security scans.** Dependabot/dependency graph, secret scanning and supported code scanning with least-privilege workflows; define severity ownership and SLAs.
6. **Audit Supabase RLS and the service-role boundary.** Inspect server-function call sites, public readers, migration grants and `SECURITY DEFINER` SQL; test cross-user access boundaries.
7. **Establish production observability and SLO baselines.** Instrument `src/server.ts`, critical server functions and DB access with request IDs, latency, error and dependency metrics; redact sensitive data.
8. **Benchmark and optimize the main journeys.** Profile map viewport/discovery, locality listings, ingestion and journey routes; add load tests before selecting cache/queue/replica changes.
9. **Build a privacy-safe product-learning loop.** Add the minimal consented activation/funnel contract and voluntary feedback flow; aggregate by journey/locale without leaking personal conversations.
10. **Introduce the first reviewed locale and global readiness gates.** Add locale-aware routing/messages/formatting, canonical and reciprocal language annotations, accessibility and translation QA before scaling content globally.

## 10. First five engineering tasks

Work with existing branches and PRs rather than duplicating them. All changes should target an isolated branch and pass independent review; repository policy prohibits autonomous merge to `main`.

### Task 1 — Stabilize and deduplicate the active work queue
**Why first:** a large conflicted queue raises the risk of duplicated fixes and obscures what has actually shipped.  
**Scope:** open PR inventory, recent commits/unique files, base-branch alignment, checks, duplicate/superseded status, and named owner/next action.  
**Acceptance criteria:**
- Re-query the live PR list at triage start; the baseline inventory captured 93 open PRs before PR #254 existed. Record category, intended base, overlap/duplicate assessment, last check result, and next action for each current PR.
- No PR is closed solely for age; unique unmerged work is identified before superseding anything.
- Cross-cutting overlapping changes (especially #247/#249 SEO and #250/#251 CI) have one explicit integration sequence.
- A weekly summary reports opened/merged/closed PR count, median time-to-review, stale count, and green-check rate.

### Task 2 — Review CI hardening PR #250 and preserve required gates
**Scope:** `.github/workflows/verify.yml`, PR #250.  
**Acceptance criteria:**
- Only obsolete runs for the same source branch are cancelled; unrelated branch runs are not cancelled.
- Workflow token has only `contents: read` unless a proven step needs more.
- Required status context remains exactly `verify`.
- Repeated push tests show the newest SHA receives a complete lint/test/build run.
- Failure, cancellation and branch-protection behavior is documented. Do not merge without independent review and all required checks.

### Task 3 — Reconcile shared SEO indexability and public sitemaps
**Scope:** `src/lib/seo.ts`, `src/lib/service-page.ts`, new locality/service sitemap modules and `src/routes/api/public/sitemap*.ts`; coordinate PRs #247 and #249.  
**Acceptance criteria:**
- Page metadata and sitemap URLs use the same indexability predicate.
- Fixed public screens remain in an explicit child sitemap.
- Dynamic locality/service sitemap results include only genuine currently useful public pages; demonstration-only, private or incomplete/uncertain data fails closed.
- Bounded scans, stable ordering, maximum row limits, errors and HTTP status codes have deterministic tests.
- `robots.txt`, static `sitemap.xml`, dynamic `/sitemap.xml`, sitemap index and child paths are mutually consistent.
- No user-specific record, private profile, identifier or unapproved location leaks through sitemap output.

### Task 4 — Add published SEO smoke checks
**Scope:** PR #251, `.github/workflows/seo-live-smoke.yml` and `scripts/seo-live-smoke.ts`.  
**Acceptance criteria:**
- Tests cover expected success, redirects, non-200 responses, invalid content types, malformed XML, missing canonicals and private-path leakage.
- Workflow runs on schedule and manual dispatch with read-only permissions and bounded timeout.
- Failure output identifies the exact endpoint and violated assertion, but does not print secrets or raw personal data.
- The smoke job is explicitly separate from local unit tests and does not claim search-engine indexing.

### Task 5 — Complete an authorization and secret/dependency baseline
**Scope:** `src/integrations/supabase/client.server.ts`, `src/integrations/supabase/auth-middleware.ts`, server functions in `src/lib/*.functions.ts`, `supabase/migrations/*.sql`, and CI.  
**Acceptance criteria:**
- Every privileged service-role import/call site is enumerated and proven server-only.
- Tests cover anonymous access, cross-user reads/writes, ownership changes, blocked/reported records and admin-only paths.
- High-risk SQL functions have documented grants, fixed `search_path`, deliberate `SECURITY DEFINER` use and negative tests.
- Dependency and secret scanning runs automatically and reports triageable findings.
- No secret value or personal data is added to the repository or CI logs; production changes remain approval-gated.

## 11. Twelve-month roadmap

Quarter definitions are relative to the programme start (2026-10-21). Critical security/reliability work takes precedence over calendar sequencing.

| Month | Focus | Main repository areas | Exit evidence |
|---|---|---|---|
| 1 — Oct/Nov 2026 | Baseline and queue stabilization | GitHub PRs/workflows; `docs/agents/STATUS.md`; `src/server.ts`; auth/client boundaries | Current status document matches GitHub; active PRs triaged; CI queue behavior defined; security/deployment unknowns assigned. |
| 2 — Nov/Dec 2026 | SEO correctness and security scanning | `src/lib/seo.ts`, service/locality sitemap routes/tests, `.github/workflows/` | Local route/meta/sitemap regression tests pass; published smoke is scheduled after review; scans are triaged. |
| 3 — Dec 2026/Jan 2027 | Observability and restore/load baseline | `src/server.ts`, server functions, Supabase migrations/policies, scripts/docs | SLOs documented from measured baseline; DB/HTTP dashboards available; load and restore rehearsals recorded. |
| 4 — Jan/Feb 2027 | Critical journey quality | `src/routes/index.tsx`, locality/service routes, `src/components/living-map.tsx`, relevant tests | Instrumented onboarding and discovery funnel; top usability/accessibility defects fixed and verified. |
| 5 — Feb/Mar 2027 | Backend efficiency | `src/lib/world.functions.ts`, listings, locality/places, ingestion modules, DB indexes | Slow queries, connection saturation and hot reads measured; only evidence-backed index/cache/queue changes deployed. |
| 6 — Mar/Apr 2027 | Feedback and first agent evaluation | `docs/agents/`, draft-assist modules, new consented feedback/event contracts | One bounded agent and one opt-in feedback pipeline evaluated against labeled examples and human-reviewed usefulness. |
| 7 — Apr/May 2027 | Localization foundation | `src/routes/$country.*`, shared UI, metadata helper, new locale catalog/formatting modules | One launch locale has human-reviewed strings, locale-safe formatting, canonical strategy and end-to-end route coverage. |
| 8 — May/Jun 2027 | First market pilot | Locality data, ingestion adapters, service pages, market scorecard | Inventory truthfulness, acquisition, activation, retention, support and safety metrics from a limited pilot. |
| 9 — Jun/Jul 2027 | Regional performance and operations | Server/cache/DB boundaries, CDN/deployment settings, worker/queue modules if warranted | Regional latency and provider failures measured; scaling changes supported by load results and rollback drills. |
| 10 — Jul/Aug 2027 | Scale/cost optimization | Hot-route/query code, caching and ingestion; observability | Cost/DAU and cost/request are measured; changes improve cost or latency without violating consistency/privacy. |
| 11 — Aug/Sep 2027 | Reliability and agent assurance | CI, agent evaluation/logging, DR/incident docs, security tests | Restore/failure exercises pass; agent false-positive/cost/acceptance rates reported; escalation policies rehearsed. |
| 12 — Sep/Oct 2027 | Consolidation and next plan | Roadmap/ADRs, metrics dashboards, technical debt backlog | Next-year plan cites actual adoption, SEO, reliability, security and cost outcomes; unproven billion-scale assumptions remain labeled. |

## 12. Required weekly operating loop

1. Pull the latest `main` SHA, check status/workflow results, open PRs, issue queue, and deployment/database/SEO/analytics evidence available.
2. Pick one high-impact bounded task; record owner, evidence, dependencies, acceptance criteria, risk and rollback plan.
3. Check overlapping PRs before creating a branch. Use the documented agent state/lease/invariants model if an orchestrator is actually running.
4. Implement on a new or correctly-owned branch; add tests and documentation. Never force-push, weaken tests, or merge a change authored by the reviewing agent.
5. Run the real repository checks (frozen install, lint, tests, build, plus focused security/SEO/e2e checks when available) and report exact output. A GitHub check passing for an earlier SHA is not a pass for the current SHA.
6. Review the diff for private data, secrets, authorization, SEO leakage, fixture contamination and accidental scope expansion.
7. Open/update a PR and record measured outcomes. Require human approval for production migrations, secrets/permissions, risky data changes, deploys and merges.

### 24/7 automation boundary

GitHub Actions can run scheduled workflows and CI when enabled, but this repository snapshot alone does not demonstrate a continuously available autonomous coding service. Continuous operation additionally requires configured compute, authorized credentials, budget controls, observability, failure recovery, task ownership/fencing, and human-approved policy. No agent should receive unbounded production access, and existing repository policy expressly forbids autonomous merge to `main`.

## 13. Evidence required next

Request or connect: live origin responses and deployment configuration; Supabase schema/policies/indexes/query stats/backup settings; hosting and billing telemetry; error/request traces; Search Console and product analytics; consented feedback samples; external provider credentials/quotas; and the actual agent runner/status. These are blockers to a measured capacity claim, full security audit, production SEO assessment, cost model and confirmed 24/7 autonomy.
