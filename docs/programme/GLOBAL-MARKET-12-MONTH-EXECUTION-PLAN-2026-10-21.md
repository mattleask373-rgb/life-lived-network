# Real World Atlas — Global Growth Phase Reset

**Revision:** 3 — 22 October 2026  
**Status:** Draft for owner review; not a launch authorization  
**Canonical repository snapshot reviewed:** main at d02459a384cb8ffcc6201839d45645e178ef0b2b  
**Purpose:** Replace the previous activity-heavy rolling plan with one outcome-led strategy for global growth and governed, continuous AI operations.

> **Strategic decision:** Build a globally repeatable system for creating real-world value, one verified local market at a time. Do not attempt to launch every category in every country at once. Automate research, verification, delivery, learning and preparation wherever safe; retain human control of production, money, legal commitments, private data and consequential external actions.

This document is the proposed operating plan. It does not authorize merge, publish, production data changes, provider activation, paid spend, external contact, or autonomous production actions. The product constitution in README.md and the canonical architecture ADRs continue to govern the application. Issues #263 and #279 remain the execution and release-readiness references until their status is explicitly reconciled.

---

## 1. Executive evaluation

Real World Atlas has a differentiated and worthwhile ambition: help people turn an intention, a need, a skill or a moment of curiosity into a real-world experience. Over time, its opportunity is to connect capabilities, needs, places, work, music, local knowledge, experiences and community into one trusted network.

The global opportunity does **not** come from placing every possible category on a map, generating thousands of locality pages, adding an LLM to every surface, or running more AI agents than other companies. Those are inputs. The advantage comes from reliably connecting real intent to current, eligible supply, helping people act with consent, and learning which local interactions produce value.

### The product thesis

**For a person with a real, time-bound need or intention, Real World Atlas should make it easier to find a real, relevant, willing person, place or opportunity; understand the evidence; choose whether to connect; and complete something worthwhile outside the app.**

A user may find a service, discover work, meet a creative collaborator, attend an event, learn from a local, contribute to a community project, or honestly learn that no verified option is available yet. The product should help users take the next sensible step, not keep them browsing.

### What makes this different

1. **Truthful discovery:** real supply, visible provenance and freshness, precise locality scope, and honest uncertainty.
2. **Human agency:** people control visibility and contact; AI suggests and explains but does not secretly decide.
3. **Connection across domains:** a real opportunity may lead to an experience, a skill exchange, a community or a journey. Build these connections only when actual data and user value justify them.
4. **Repeatable local operations:** every new locality uses the same quality gates, data contracts, safety controls, measurement and launch playbook.
5. **Compounding learning:** the system learns which sources, offers, intents and experiences result in real outcomes, not just pageviews.

### The strategic correction

The prior plan correctly identified many architectural, privacy, SEO, ingestion, analytics and agent-runtime dependencies. It also gave many of those ambitions equal prominence, creating a risk that the team improves infrastructure and expands scope indefinitely before proving the whole user journey.

The next phase must have one dominant objective: **prove and repeat one useful real-world exchange.** Security and source-of-truth work are not distractions; they are prerequisites to trust. SEO, data ingestion, AI and agent automation then become accelerators of a validated loop rather than parallel projects competing for attention.

### Global means repeatable, not simultaneously everywhere

Build global-ready contracts and market operations now where they are already needed. Expand public supply and acquisition only where local evidence, permissions, trust and support exist. The sequence is:

**one locality and one use case → a reliable exchange loop → a second locality using the same playbook → an adjacent category → a region → multiple countries → a global operating system.**

Each expansion is earned through measured outcomes and safety, not decided from ambition alone. Billion-user reach remains an aspiration, not a forecast, launch plan or claim of current capacity.

---

## 2. Evidence boundary and current reality

This section records observed state from the 22 October 2026 review. It separates tool observations from earlier reports and from facts that remain unknown. It is not a penetration test, complete market study, legal opinion, production audit or load test.

### Repository and Lovable continuity

- The latest verified GitHub main SHA in this review is **d02459a384cb8ffcc6201839d45645e178ef0b2b**.
- Comparing main with the branch named **Loveable/work/safely** returns **diverged**, with 16 commits ahead and 270 behind; merge base ccbcc6acdbc3dcdf6895c0f624b301418257a6e3.
- The comparison reports branch-only differences in .lovable/plan.md, src/integrations/supabase/previewAuthStorage.ts, src/lib/map-view.ts and src/lib/work-opportunities.ts. Those differences require review, not blind merge or discard.
- The exact Lovable Project Settings → Git repository and active sync branch still require human confirmation. Project metadata shows the Real World Atlas project exists and has a preview and published URL, but project metadata does not prove which branch or commit is deployed.
- Do not write code through Lovable until the owner confirms the connected repository and an isolated, non-main sync branch. Do not rebase, force-push or bulk-sync a divergent branch. Preserve unique changes, reconcile using a normal review path, and verify the resulting commit and preview.

Reference: [Lovable Git sync documentation](https://docs.lovable.dev/integrations/git-sync-overview).

### Analytics are not evidence of market traction yet

The connected Lovable analytics report for **22 September–22 October 2026** uses a legacy analytics source and reports 927 visitors and 934 pageviews. The leading page paths include /sitemap.xml (525 views) and /api/public/sitemap.xml (283 views). Direct is the largest source at 867, followed by google.com at 54 and bing.com at 6; 808 visitor country records are Unknown. The session-duration series is not usable as a trustworthy completion or retention measure.

These measurements do **not** establish 927 human prospective customers, organic demand, active users, conversion, repeat participation or successful real-world exchanges. Sitemap endpoints dominate reported views, and the data may include crawler and automated traffic. Confirm analytics instrumentation and crawler treatment before using it to allocate acquisition spend.

Reference: [Google's explanation of Analytics and Search Console differences](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console).

### Product and architecture

The existing direction already includes canonical locality discovery, map/list interaction, an ingestion contract, service and opportunity concepts, provenance and freshness work, indexability controls, and the principle that findSupply() remains the sole discovery authority. Use and reconcile existing implementations; do not build a second matcher or a parallel acquisition model.

The current plan and live issue board flag integration dependencies across sitemap and route privacy, map query scope, source freshness and publication eligibility, authentication storage, default database privileges, and the proposed public place assistant. The exact current state of each PR, review, security finding and host behavior must be freshly checked by the lane owner before work begins. A historical report or passing unit test is not a substitute for a live verification.

The public “Ask this place” assistant remains disabled unless issue #209's prerequisites are met. Parser tests do not prove licensed inventory, active imports, provider availability or a live market.

### Continuous AI operations

No persistent executor, durable work-queue heartbeat, lease recovery, kill switch, spending controls and end-to-end audit trail have been verified together as a running 24/7 system. Documentation describing an intended control plane does not prove the worker exists, is scheduled, or can recover after failure.

The current verified mode should be treated as **on-demand agent work with shared GitHub records**, until a scheduled non-production executor is demonstrated and independently checked. Do not claim the fleet is already operating continuously.

### Consequence

The first measure of progress should be verified real-world outcomes and the ability to reproduce them safely. Pageviews, prompts run, agents spawned, lines changed, PRs created, countries named and URLs indexed are diagnostic activity—not success measures.

---

## 3. The first market: a disciplined beachhead

The platform can eventually support many kinds of real-world activity. The first market must be narrow enough to build trust and liquidity, but representative enough to validate the core architecture.

### Recommended product loop

Start with one locality and one practical, repeatable, non-regulated or appropriately reviewed use case in which a requester and willing provider can find each other, agree on terms and confirm the outcome. The likely shape is a local offer-and-need exchange.

Cleaning or short-term-rental turnover is an existing candidate in issue #263. Gardening, simple local help or another service may be a better candidate in a specific locality. **Do not declare the category chosen until evidence supports it.** Confirm local rules and insurance/worker-status implications, the ability to recruit genuine providers, the frequency and urgency of demand, user safety, and whether the existing product can support the exchange without speculative schema or a second discovery engine.

Avoid initially depending on regulated work, complex payments, accommodation guarantees, emergency services, exact personal-location disclosure, or unverified third-party inventory.

### Pilot selection scorecard

Score each candidate locality/category from evidence, with a written source and date for each material claim. Suggested weights are a proposal to make trade-offs explicit, not measured truth:

| Criterion | Suggested weight | What counts as evidence |
|---|---:|---|
| Reachable real supply | 25% | Providers who can be contacted legitimately and are willing to participate |
| Demonstrable local demand | 20% | Interviews, requests, first-party intent data or verifiable partner needs |
| Access to anchor participants | 15% | Hosts, businesses, community groups or organisers who can help test |
| Safety and regulatory simplicity | 15% | Low-risk category, understood local obligations, viable reporting/support |
| Repeat use and local frequency | 10% | The need occurs often enough to test a repeat loop |
| Lawful source/data path | 10% | Rights, terms, freshness and provenance are understood |
| Localization and operational effort | 5% | Language, support and operational burden can be managed |

Do not fill gaps with invented market-size numbers, search volumes or supplier estimates. Where evidence is unknown, record UNKNOWN and gather it.

### Supply-first, not empty global expansion

For a two-sided or multi-sided product, expanding the demand side before enough eligible supply exists can create empty experiences in every new locality. Seed and verify a small amount of genuine supply in one market before driving meaningful demand into it. This is consistent with staged marketplace guidance, which warns against expanding geography before local liquidity is established ([reference](https://twosided.io/blog/marketplace-growth-strategy), 4 July 2026).

Proposed pilot seed:
- 10–20 opted-in, real providers or offers in one locality/category;
- 5–10 real requesters or partner participants recruited through legitimate, human-led contact;
- a clear description of price/pay, timing, eligibility and who is responsible for fulfilment;
- a functioning path for enquiry, response, agreement, completion, reporting and support.

These are initial hypotheses to validate—not representations that the current system has that supply or that these numbers guarantee product-market fit.

---

## 4. Global growth engine: six connected systems

Growth should be an observable, evidence-led operating loop. It should not become a collection of unrelated marketing automations.

### A. Market intelligence

Continuously identify candidate demand patterns, locality gaps, source opportunities, competitor substitutes and partner types. Use reputable current sources, approved first-party analytics, search-console evidence and human interviews. Every market dossier must identify sources, dates, coverage limits, uncertainty and a specific testable hypothesis.

Outputs: ranked hypotheses, an evidence ledger, candidate locality/category scorecards and a short list of validation actions. This lane researches; it does not assert demand merely because a phrase occurs in search data.

### B. Supply acquisition and onboarding

For the chosen niche, discover legitimate ways to reach providers, prepare an onboarding offer, verify terms and eligibility, and help providers publish accurate listings. Begin with real direct conversations and a small number of anchor partners.

AI may research public business information where permitted, deduplicate candidate records, draft personalised messages, prepare call scripts, monitor stale records and suggest improvements to provider onboarding. A human approves external communications and commercial commitments. Do not harvest personal data without a lawful basis, scrape prohibited data, spam, invent supplier consent, or auto-publish a provider who has not approved their information.

### C. Intent-to-outcome conversion

Instrument and improve the exact path:

**intent → locality resolution → canonical findSupply() → eligible useful result or honest quiet state → consented enquiry → provider response → agreed activity → outcome confirmation → optional feedback or referral.**

For each failure, determine whether it is an intent problem, locality problem, supply gap, freshness/eligibility issue, contact friction, slow response, trust concern or product defect. Do not “fix” empty results by adding fake pins, guessing availability, broadening the search silently or bypassing publication checks.

### D. Search and content growth

Use technical SEO to make genuinely useful public pages discoverable. Use one canonical policy for route metadata, public APIs, internal links, structured data, robots and sitemaps. Index only pages that pass that policy and have real, eligible, current content. Keep private routes and private user data out of public routes, sitemaps, exports and model context.

A locality page is not valuable just because it exists. Never mass-generate thin pages or claims for markets that lack supply. Use Search Console impressions/clicks and qualified human actions as separate signals; sitemap hits do not show demand. Live robots/sitemap behavior must be verified against the confirmed production host after an explicitly approved release.

### E. Trust, contribution and repeat participation

Trust is part of conversion and supply quality. Make provider control, provenance, freshness, response expectations, consent, reporting and support obvious. After an exchange, ask for an optional confirmation and feedback; never turn kindness or connection into a popularity score.

Only use referrals after a participant has a genuine useful outcome. The product should invite a person to share a useful experience, not send unsolicited mass invitations or pressure people into social interaction.

### F. Experimentation and capital efficiency

Each growth experiment must declare a hypothesis, target cohort/locality, baseline, one main variable, measure, duration or stopping rule, risk guardrails and owner. Prefer manual validation and small experiments before code or spend. Automate analysis and experiment reporting; do not autonomously approve or increase paid budgets.

No paid acquisition until analytics can distinguish meaningful human activity from crawlers and the product has enough verified supply to serve the demand. Every experiment must be reversible and its outcome recorded.

---

## 5. Commercial model and unit economics

Global growth must lead to a sustainable service, but monetization should follow demonstrated value rather than be used to disguise a product that has not yet achieved reliable local liquidity.

### Commercial principles

- Keep essential discovery, participation and human connection accessible. Do not paywall basic safety, consent, reporting or access to a person's own data.
- Do not sell private user data, use private needs/memories for targeting, or turn human relationships into a popularity/ranking economy.
- Do not sell “verification.” Verification must reflect evidence and policy, not payment.
- If placement is ever sponsored, label it clearly and keep relevance, eligibility and safety requirements intact. Payment must not turn an ineligible or stale item into a valid result.
- Do not build payment flows, take rates or financial escrow until the value chain, liability, refunds, disputes, taxes, chargebacks and applicable country rules have been reviewed.
- Treat each business model as a hypothesis. No pricing, contracts or financial commitments without human approval.

### Candidate models to evaluate after the pilot

1. **Free pilot / provider retention first.** Start by proving that the service creates value, that providers respond and that exchanges complete. Record provider time/cost and request fulfillment; do not assume willingness to pay.
2. **Provider tools or business subscriptions.** Consider optional paid tools only if providers repeatedly value a verified profile, availability management, enquiry workflow, schedule, reporting or operational software beyond basic visibility.
3. **Transparent transaction fee.** Consider only where the platform genuinely supports or manages the transaction and where the legal, payment, refund, dispute and support model is ready. A fee taken on off-platform outcomes may be unenforceable or damage trust.
4. **Partner-funded local utility.** Community organisations, venues, municipalities, accommodation operators or business groups may sponsor clearly defined local services or onboarding where benefit and obligations are transparent.
5. **Clearly labelled sponsored discovery.** Defer until there is enough high-quality organic supply and ranking governance to avoid undermining user trust.

### Unit economics and go/no-go

Measure cost per completed outcome, provider acquisition and onboarding cost, moderation/support cost, source/API costs, infrastructure and the share of providers who return. Measure willingness to pay with real conversations or approved experiments, not assumptions.

Do not start major paid acquisition until the funnel is trustworthy, a locality has adequate supply, and the team knows what one incremental completed outcome costs. Any ad-spend test needs a human-approved budget, named owner, stop-loss threshold, attribution and a rollback plan. Agents may research, draft campaigns and report results; they may not increase budgets or accept commercial terms autonomously.

## 6. The multi-agent operating model

The objective is **continuous progress**, not continuous unbounded model activity. A healthy 24/7 system is event-driven: scheduled checks and new evidence wake bounded workers, work is recorded durably, and agents stop when no valid task is ready. It should not spin in endless chat loops or consume tokens for the appearance of activity.

### Roles and separation of duties

| Role | Main responsibility | Must not do |
|---|---|---|
| Human owner / product lead | Strategy, market/category selection, budget, safety posture, external commitments, merge and release approval | Delegate accountability for consequential decisions |
| Orchestrator | Maintain the dependency graph, task queue, leases, priority and handoffs; prevent duplication | Invent product direction or bypass approval gates |
| Market intelligence | Evidence-backed demand, source and locality dossiers | Invent demand, search volume, supply or market sizes |
| Supply operations | Provider candidates, onboarding support, freshness and supply-gap diagnosis | Contact people or publish offers without authorization |
| Implementation agent (e.g. Grok or an approved coding worker) | Bounded change in an isolated branch with tests and a draft PR | Commit directly to main, widen scope or merge its own PR |
| UI implementation agent (Lovable) | UI work only after repo/sync branch is owner-confirmed and protected | Write into an unknown or main sync target |
| Independent reviewer (e.g. ChatGPT/Claude) | Challenge assumptions, review diffs, adversarial tests, evidence quality and acceptance criteria | Rubber-stamp its own work or claim testing it did not run |
| Security, privacy and QA lane | Route/data access, rights, adversarial tests, privacy, accessibility, reproducibility | Weaken access controls or tests to get green |
| Data / SEO operations | Source permissions, ingestion evidence, indexability and host monitoring | Activate feeds, publish unqualified supply or create thin pages |
| Analytics/evaluation lane | Validate event definitions, funnel, quality, cost and experiment effects | Treat model calls, bots or pageviews as completed outcomes |

These are work lanes, not proof that the corresponding agents, subscriptions, credentials or connectors are currently available. In this environment I can access GitHub and the connected Lovable project. I do not have a confirmed direct execution channel to start or schedule Grok and Claude on your accounts from this plan. Their participation requires a human to hand off the task or an explicitly configured, authenticated integration. Do not mark an agent active until a real run and its evidence are visible.

### One shared contract for every agent task

Every task begins with:
- Objective and user/market outcome served;
- Evidence and current SHA, plus links to the relevant issue and PRs;
- Hypothesis and acceptance criteria;
- Scope in and out, dependencies and file/area ownership;
- Risk classification, privacy/security/SEO and source-rights impact;
- Test plan and proof required; rollback or recovery path;
- Required human decision and explicit stop conditions.

Every handoff returns:
- STATUS: done / partial / blocked;
- owner/lane, branch, exact commit SHA and changed files;
- exact-head CI links and exact commands/results;
- manual checks performed and NOT RUN items;
- evidence/source dates, assumptions, unknowns and limitations;
- security/privacy/source/SEO impact;
- human gate and next smallest safe action.

### Shared memory and task discipline

Use GitHub as the auditable source of task truth: issues for objectives, PRs for changes, explicit evidence in comments, and a canonical execution board. Reconcile #263 and #279 rather than create another competing board. Keep docs/agents/STATUS.md dated and concise; stale snapshots must be labelled historical.

Use issue claims or equivalent leases with owner, expiry and heartbeat. One active owner per task and a declared file/path scope. Independent reviewers do not implement the same change they approve. Agents first inspect open PRs, current base/head, exact check runs, changed files, approvals and dependencies. Merge candidates with overlapping paths into one authoritative implementation rather than adding a new parallel version.

Proposed initial concurrency limits, pending operational evidence:
- no more than 3 active implementation/research tasks at once;
- no more than 5 actively worked PRs in the integration queue;
- each agent has a bounded task and deadline/lease, per-run and daily cost ceiling, and maximum retry count;
- no new initiative while the same shared path has an unresolved competing implementation;
- after 3 materially similar failures, stop retries and submit a diagnosis;
- no agent is rewarded for number of messages, lines, commits or PRs.

The limits can rise when task completion, review load, rollback rate and cost demonstrate that doing so improves throughput without degrading quality.

### How a real 24/7 executor must work

Before calling this a continuous agent fleet, implement and demonstrate all of the following in an isolated non-production environment:

1. **Durable scheduler and queue:** jobs survive worker restarts; a documented event or schedule starts them; timeouts and service outages do not lose tasks.
2. **Task identity and idempotency:** every task has a stable ID, idempotency key, explicit owner, allowed tools, scope, expected output and state transition.
3. **Lease and stale recovery:** claims expire safely; stale workers cannot continue writing; duplicate workers cannot publish duplicate results.
4. **Least-privilege execution:** separate read-only research from branch-writing tasks; separate staging from production; credentials are short-lived, scoped and not exposed to model context or logs.
5. **Isolated workspaces:** code tasks run in a disposable workspace/branch; dependencies, network access and file permissions are constrained; untrusted source text is treated as data, not instructions.
6. **Deterministic checks:** lint, typecheck, tests, dependency/security scans and builds run independently of model claims. A reviewer receives the exact diff and evidence.
7. **Budgets and rate limits:** per-task, per-agent and daily limits; retry ceilings; alert thresholds; no autonomous increase to subscription, API or advertising spend.
8. **Human approval boundary:** sensitive actions pause on an explicit owner decision. A prompt or UI policy is not an access-control boundary.
9. **Audit and observability:** append-only run ledger, task status, queue depth, stale leases, failures, token/API cost, PR acceptance, incidents, wake-up cause and resulting commit.
10. **Kill switch and rollback:** the owner can immediately stop new work, revoke worker credentials, cancel active jobs and disable automation without corrupting the queue.
11. **Recovery drill:** prove restart, duplicate delivery, cancellation, budget exhaustion, revoked credentials, malformed provider data and kill-switch behavior.
12. **Independent acceptance:** the security/operations reviewer checks the proof in a disposable environment; the human owner authorizes any rollout beyond it.

First inspect existing control-plane work and migrations referenced by issues #74, #100, #116, #117 and #121. Do not assume a durable table, heartbeat or scheduler exists because a branch, plan or migration proposal mentions one. Do not create a second control plane before evaluating the canonical one.

A GitHub scheduled workflow can be useful for periodic checks, but a cron file alone is not a durable job system or proof of continuous operation. Prefer event-triggered work plus bounded periodic reconciliation over an agent that reasons constantly. The requirement is dependable, observable progress—not continuous spend.

---

## 7. Autonomy levels and human gates

| Level | Allowed automation | Human gate |
|---|---|---|
| 0 — Observe | Read state, run approved health checks, produce evidence reports | Approve access and destinations once |
| 1 — Propose | Draft issues, market dossiers, copy, provider lists from permitted sources, outreach drafts, experiments and technical plans | Approve external use and priority |
| 2 — Build for review | Edit isolated branches, run tests, open/update draft PRs, generate staging fixtures | Human review and merge |
| 3 — Bounded staging | Perform specifically approved reversible staging tasks with scoped credentials and budget | Human approval for the task class and isolated environment |
| 4 — Production / external action | Deployment, production data or permission changes, live feed activation, paid spend, external messaging, pricing or legal/contract changes | Explicit human approval every time, except only if a separately approved policy gives narrow, revocable delegation after a successful control-plane audit |

The default policy for this phase is that agents must **not** autonomously merge to main, publish/deploy, mutate hosted production data/schema/RLS/grants, enable live provider feeds, message users/providers at scale, spend money, accept contracts, change security policies or turn on a public AI endpoint.

An automation may suggest an action and prepare the artifacts; authenticated code enforces policy; an accountable human decides consequential actions. Do not use a model's confidence as proof.

---

## 8. Stage-gated path to global growth

The programme is rolling and outcome-gated, not a calendar promise. A blocked gate must be recorded; safe non-overlapping research can continue, but later stages do not inherit a presumed pass.

### Gate 0 — Establish the source of truth

Required:
- Human confirms Lovable Project Settings → Git repository, active sync branch, connection status and intended deployed hostname/backend.
- Record main SHA, candidate project/published SHA, sync branch/head/base and all divergence.
- Recheck branch/ruleset enforcement, required exact-head checks, reviewers, bypass actors and branch deletion/force-push rules.
- Confirm staging/production isolation, credentials, queues and provider side effects.
- Inventory unresolved PR overlaps and designate one canonical implementation per concern.

Exit: a reviewed reconciliation plan exists; no blind sync is required to make the preview look current. Any merge occurs only through a protected PR with owner approval.

### Gate 1 — Trustworthy public foundation

Required:
- Resolve the private/public route policy so user-only data and Life List content cannot leak through pages, APIs, sitemaps, exports or model context.
- Reconcile the sitemap options in #247/#249/#252 and private-route work in #253 into one route/indexability policy. Enumeration must be complete, cursor-safe and fail closed; do not publish a partial sitemap as complete.
- Freshly verify current status of #164 and complete an access/grant/RLS matrix in a disposable database before any hosted change.
- Keep authentication-storage work such as #235 on its independent security review track.
- Verify source freshness/provenance and publishability in the canonical data path.
- Recheck the host's robots, sitemap index and child sitemaps with GET-only tests after an explicitly approved release; do not infer live behavior from source code.
- Require exact-head CI and manual accessibility/UX checks for UI changes.

Exit: a reviewed and tested foundation, with the remaining live-host and security facts recorded as verified or explicitly blocked.

### Gate 2 — Choose the pilot with evidence

Required:
- Compare no more than three candidate locality/category pairs using the scorecard in section 3.
- Gather real demand evidence and legitimate supply access; label every evidence item and its date.
- Confirm local obligations, safety/support capacity, provider terms, data permissions, privacy and the expected unit economics.
- Define a single end-to-end user journey and the minimum instrumentation before development.
- Write a go/no-go decision with the human owner named.

Exit: a chosen locality and category with reachable participants, a lawful supply path and a measurable problem worth solving.

### Gate 3 — Seed genuine supply and deliver the first loop

Required:
- Onboard 10–20 genuine opted-in offers/providers and test with 5–10 real requesters/partners, as a proposed pilot starting point.
- Use the existing domain contract and findSupply(); no second matcher, fake profile, synthetic pin or invented availability.
- Confirm that the offer/request has accurate terms, locality, source, freshness, eligibility and publication status.
- Test consented contact, provider response, cancellation, report/block/support and completion confirmation end to end.
- Include quiet, stale, error and no-result states with a useful next step that does not imply supply exists.

Exit: the system can demonstrate and document a real exchange from intent through outcome in the chosen market, with no unresolved high-severity safety or privacy incident.

### Gate 4 — Prove local liquidity and repeat use

Proposed initial learning thresholds, to be reviewed after baseline collection:
- at least 20 genuine requests in the pilot;
- at least 50% receive a provider response within 24 hours;
- at least 10 exchanges are confirmed complete;
- fewer than 5% of requests are reported as abusive, fraudulent or materially misleading;
- at least 60% of participating providers say they would continue;
- no unresolved severe safety/privacy incident;
- the team can calculate time-to-first-useful-result, request-to-response, response-to-completion, stale-supply rate and cost per completed outcome.

These thresholds are not statistical proof of product-market fit. They are a decision aid for early learning. Record sample sizes and uncertainty; adjust thresholds through owner-approved evidence, not to make a failed pilot appear successful.

Exit: evidence shows that the core loop is useful, supportable and safe enough to test replication.

### Gate 5 — Replicate one locality, same category

- Run the same playbook in a second locality.
- Track setup effort, eligible supply, response times, completion, user retention, incidents and cost.
- Identify what is genuinely reusable and what requires local adaptation.
- Do not broaden the category until the second locality reaches acceptable outcome and safety metrics.

Exit: local activation is repeatable without heroic manual effort and without degrading truth, freshness or response quality.

### Gate 6 — Add one adjacent category and localization wave

- Choose the next category based on observed user requests and verified supply gaps.
- Reuse canonical contracts, source rights, moderation, contact and outcome measurement; do not make a category-specific parallel discovery engine.
- Add languages/currencies/timezones and policy review for the actual next country; locale conversion is not proof of legal or operational readiness.
- Localize only the surfaces needed for the pilot; have a human review material cultural, legal and safety copy.

Exit: one adjacent use case passes its own supply, outcome and safety gate; localization is tested by real users.

### Gate 7 — Automate market onboarding

Only after Gates 0–6:
- An automated market dossier can collect permitted evidence, score candidate localities, enumerate relevant supply gaps, draft partner lists, prepare localized copy and propose source adapters.
- Human owners select markets, approve contracts and outreach, approve provider/feed activation and authorize releases.
- Each market is held in a state machine such as RESEARCH → EVIDENCE REVIEW → SUPPLY SEEDING → PILOT → VALIDATING → ACTIVE → PAUSED/RETIRED. A model cannot set ACTIVE without deterministic requirements and human approval.
- Publish only eligible data and useful pages; automatically pause a market or page class when freshness, source rights, safety or quality gates fail.

Exit: new localities can be prepared at scale through a controlled playbook and human review becomes a focused decision point, not a manual reconstruction of every fact.

### Gate 8 — Scale and mass growth

Paid acquisition, broad public campaigns, high-volume partner outreach, unattended production publishing and an autonomous executor are considered only after:
- a reliable completed-outcome funnel is measured;
- unit economics and service capacity are known;
- provider supply can keep up with demand;
- market replication has been demonstrated;
- privacy, security, moderation and incident response are tested;
- the continuous runtime passes the proof and kill-switch drills;
- explicit human budgets and action permissions are approved.

“Mass growth” means a proven acquisition and market-replication process that can scale within quality and unit-cost guardrails, not maximizing sign-ups or publishing the most pages.

---

## 9. Metrics that tell the truth

### Product north star

**Verified real-world outcomes per active locality per week.**

Count an outcome only when supported by a documented and privacy-appropriate confirmation from a participant or a verified event/workflow. Keep separate metrics for an outcome proposed, requested, agreed and completed. Never infer completion from a page click or an AI response.

### Product and marketplace metrics

| Metric | Definition / use |
|---|---|
| Useful-result rate | Share of eligible human discovery sessions with at least one current, in-scope result judged relevant by the user or a carefully designed proxy |
| Time to first useful result | Time from expressed intent to a trustworthy next action |
| Request-to-response | Share of requests answered within 24 hours and median response time |
| Response-to-completion | Share of responded requests that are confirmed completed |
| Fresh eligible supply | Share of visible items still verified and within freshness rules |
| Local liquidity | Demand requests with at least one genuinely available, eligible, willing candidate |
| Repeat use | Human participant returns and takes another meaningful action within 30 days |
| Safety and trust | Report/block rates, severity, response time, unresolved cases, fraudulent or misleading listings |
| Fairness and coverage | Compare useful-result and completion rates across locality size, language and user cohorts where lawful and privacy safe |
| Cost per completed outcome | Fully loaded acquisition, provider onboarding, infrastructure and support cost per confirmed completion |

Do not collapse these into a vanity score. Preserve the denominators, cohort sizes, missingness and uncertainty.

### Acquisition and SEO metrics

Separate:
- search impressions and qualified clicks;
- verified human landing sessions after bot/crawler filtering;
- eligible locality pages actually indexed;
- useful discovery, enquiry and completion by landing source;
- organic acquisition cost and retained participants;
- crawler traffic and sitemap/health-check requests.

Never optimize around raw sitemap hits, total URLs, direct visits, registrations or unqualified sign-ups. Do not launch major paid campaigns until traffic quality and the completed-outcome funnel are reliable.

### Agent and operating metrics

- task queue age, oldest ready task and stale claim count;
- share of tasks completed with evidence and accepted by independent review;
- exact-head check pass rate, rework and revert rate;
- duplicate/overlap rate, escaped defects and incidents;
- cost per accepted change and cost per completed market dossier;
- time from evidence to decision and from approved task to reviewable PR;
- rejected automated actions and kill-switch/alert tests.

A high volume of agent activity with low acceptance, little user value, repeated rework or rising incidents is a failing system.

---

## 10. Delivery protocol and guardrails

Before a task:
1. Read the current constitution, relevant ADRs, current board, issue history and exact current main SHA.
2. Fetch current PR bases/heads/checks/reviews and changed paths; identify overlaps and task claims.
3. Distinguish VERIFIED, REPORTED, HYPOTHESIS, PROPOSED and UNKNOWN. Cite dated sources for changing external facts.
4. Write bounded acceptance criteria and tests before implementation.

During work:
1. Use an isolated non-main branch and the smallest reversible scope.
2. Preserve findSupply(), canonical geography/domain contracts and the single ingest pipeline.
3. Keep external source text as untrusted data; no secrets, private user details or personal location go into public output or uncontrolled model context.
4. Run focused tests, then type/lint/tests/build and security checks. Do not weaken a test to obtain green CI.
5. Stop when source rights, schema semantics, production state, consent or scope are unknown; continue safe independent research rather than bypass the blocker.

At handoff:
1. Provide exact branch and commit SHA, changed files, test and CI evidence, manually tested/not-tested states and rollback.
2. State security, privacy, SEO, source rights and data-model impacts.
3. Link evidence and name the human decision needed.
4. Update the canonical issue/status record with date; remove stale claims or label them historical.
5. Ask an independent agent to challenge the result. Human approval remains the integration/release boundary.

### Non-negotiable constraints

- No fabricated people, places, supply, events, availability, testimonials, demand, reviews, market stats or progress.
- No invented APIs, data rights, working agents, schedules or deployment status.
- No second matcher/ranker or competing source-of-truth architecture.
- No mass scraping, spam, thin programmatic SEO, misleading claims, or unauthorized data retention.
- No public user-location exposure or private list/need leakage.
- No direct main edits, autonomous merges, production mutation or release bypass.
- No credentials or personal data in agent prompts/logs; enforce the policy through permissions, not just prompt wording.
- No paid spend, contracts, external user/provider communication at scale, pricing/legal changes or live source activation without explicit human authorization.
- No claim of global readiness or 24/7 operation without independent evidence.

---

## 11. The first ten tasks, in order

The exact PR and security state must be refreshed before a task is claimed. This is the recommended sequence, not an instruction to bypass an owner gate.

1. **Owner — verify source of truth.** Confirm Lovable Project Settings → Git repository, branch, connection status and intended production hostname/backend. Record the exact published SHA if available. No branch switch or write-capable Lovable task before this.
2. **Repository/security owner — verify protection.** Read current main ruleset, required exact-head checks, reviewer requirements and bypass actors; verify the intended integration branch has appropriate protection. Recheck secret scanning and environment isolation.
3. **Integration reviewer — reconcile Lovable divergence.** Review the 16 branch-only commits/changes in context; classify each as retain, port, superseded or reject. Do not bulk merge 270 commits or force history changes. Preserve reviewed unique fixes in ordinary PRs.
4. **Coordinator — refresh the task graph.** Reconcile issues #263 and #279 with the current status document and all open PRs. Assign one canonical implementation for overlapping SEO, viewport/map, freshness, work-source and security tasks. Enforce the active work-in-progress limit.
5. **SEO/privacy lane — converge the route contract.** Resolve current candidates among #247/#249/#252 and associated private Life List work. Ensure one policy drives metadata, internal links, public APIs, structured data, robots and complete sitemaps; test that private content never escapes.
6. **Security lane — close or explicitly block the access findings.** Refresh #164 and authentication/storage #235 status. Build the access matrix and adversarial tests in a disposable environment; do not change hosted grants or production auth settings.
7. **Analytics lane — establish a trustworthy baseline.** Classify crawler/sitemap traffic, verify analytics coverage and consent/privacy expectations, then define request, response, completion, report, and repeat-use events. No major acquisition spend during instrumentation uncertainty.
8. **Market research lane — select one pilot.** Compare up to three locality/category candidates using the scorecard. Gather 20 documented demand signals/conversations where legitimately obtainable and 5–10 potential participant conversations; record source, date, gaps, risks and go/no-go recommendation. Do not represent targets as completed contacts.
9. **Supply/product lane — seed the chosen market.** After human approval, onboard a small cohort of willing providers and requesters through the existing contracts and product surfaces. Test offer freshness, terms, locality, discovery, consented enquiry, response, completion and support. Keep the market private/staged until its publication gate is met.
10. **Operations lane — design and prove continuous automation in staging.** First document the existing control-plane state for #74/#100/#116/#117/#121. Then propose and test a read-only scheduled worker with durable task identity, least-privilege permissions, cost limits, event logs, stale-lease recovery and a kill switch. It may produce evidence and draft issues; no merge, production write, external messaging or spend. Independent review and owner approval are required before widening permissions.

If Gate 0 blocks, continue only safe non-overlapping research and review tasks. Do not work around an unknown sync destination by editing Lovable or deploying a second app.

---

## 12. Proposed owner decisions

The owner should explicitly approve or change these decisions before implementation expands:

1. **Beachhead principle:** one locality and one use case, supply-first. Accept the principle even if the final locality/category is selected after research.
2. **Candidate market:** authorize comparison of practical options (including the existing cleaning/turnover candidate) without assuming any category or country is already chosen.
3. **Measurement:** approve minimal, privacy-conscious outcome events and bot/crawler analysis before growth spend.
4. **Execution policy:** keep main protected, use isolated branches/PRs, maintain independent review, and forbid autonomous production actions.
5. **Agent runtime:** allow a staging-only proof project; do not switch on an unverified executor or call the fleet 24/7 yet.
6. **Growth delegation:** authorize research and drafts; require human approval for outbound campaigns, partner commitments, public mass publication and budgets.

These decisions give agents enough clarity to work without implicitly transferring authority over money, data, law, trust or deployment.

---

## 13. Definition of done for this phase

The phase is not complete merely because this plan is merged, an assistant is connected, a sitemap exists or a scheduled workflow has run. It is complete when evidence shows that:

- one canonical repository and safe Lovable sync path are known;
- core privacy, source-rights and access concerns are resolved or explicitly block release;
- a real participant can complete a full exchange using truthful supply and the canonical discovery path;
- real participants confirm enough outcomes and willingness to repeat to justify replication;
- the same market playbook works in a second locality;
- the funnel distinguishes meaningful human outcomes from bots and activity metrics;
- market expansion is driven by evidence and governed stages;
- the continuous worker runs reliably in an isolated environment, survives recovery tests, respects budgets and stops on the kill switch;
- all changes are traceable to exact commits, tests and reviews;
- the owner has approved each production, commercial, security and external-action gate.

The enduring question for every feature, automation or market is:

**What new, verified real-world outcome becomes possible for a person—and what evidence proves that it works safely, fairly and repeatedly?**

---

## References and live work records

- Canonical product vision and invariants: README.md and docs/adr/001-canonical-supply-engine.md.
- Integration and pilot execution board: [Issue #263](https://github.com/mattleask373-rgb/life-lived-network/issues/263).
- Release-safe integration, analytics and scale readiness: [Issue #279](https://github.com/mattleask373-rgb/life-lived-network/issues/279).
- Governed AI platform and assistant prerequisites: [Issue #209](https://github.com/mattleask373-rgb/life-lived-network/issues/209).
- Database access/default-privilege review: [Issue #164](https://github.com/mattleask373-rgb/life-lived-network/issues/164).
- Existing control-plane history: [Issues #74, #100, #116, #117, #121](https://github.com/mattleask373-rgb/life-lived-network/issues).
- Official Lovable Git sync behavior: [Lovable Git sync docs](https://docs.lovable.dev/integrations/git-sync-overview).
- Analytics/Search Console interpretation: [Google Search Central](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console).
- Staged marketplace growth reference: [Two-sided marketplace playbook](https://twosided.io/blog/marketplace-growth-strategy), 4 July 2026. Treat it as directional industry commentary, not evidence about this product's demand.

**Last rule:** a green check verifies only the thing it actually checked. A research dossier is not supply, a drafted outreach message is not a conversation, a PR is not a release, a preview is not production, and a scheduled agent is not a reliable 24/7 operating system until the entire loop has been demonstrated.
