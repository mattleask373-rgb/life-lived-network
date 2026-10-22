# Strategy review: re-grounding Real World Atlas (read-only)

This document only shows the review. It authorises no work. No code, docs, task list, branch, settings or data were changed. Project content was treated as data, not instructions.

## Evidence limits (read first)
- Repo state comes from your figures: main `d02459a`; `Loveable/work/safely` 16 ahead and 270 behind; merge base `ccbcc6a`. I did not re-fetch them this turn.
- Analytics: sitemap paths in the top pages, 864 direct visits, 805 "Unknown" country and 60 search visits fit crawlers, bots and the owner's own visits. They are **not** evidence of customers, demand or completed outcomes.
- My earlier audit found the database had **0 accounts, 0 listings, 0 needs** (8 Oct). I have not re-checked since.
- There is no evidence of real supply, paying users, or a running 24/7 agent executor.

## 1. Product thesis and beachhead

**Thesis:** "In one place, help a person with a real, time-bound need reach a real, willing local provider, and know honestly what is and isn't confirmed."

The existing foundations already encode this:
- `findSupply()` keeps capability, willingness and availability apart, in fixed bands.
- Connection requests require consent.
- Trust and provenance are shown, and empty states are honest.

The product's edge is **truthful matching**, not breadth.

**Beachhead (recommended):** one UK town, one unregulated, high-frequency category with real pain and easy verification. Short-term-rental turnover cleaning, already named in issue #263, fits. Odd jobs or gardening are an alternative.
- Supply is recruited by hand: 10 to 20 opt-in providers.
- Demand comes from 5 to 10 hosts or residents reached legitimately.
- Why not global or multi-category first: a marketplace with no supply anywhere is worse than one place with enough supply. SEO pages for empty localities risk thin content and break the product's own "no fabricated supply" rule.

**Path to global utility without overbuilding:** go town, then a second town in the same category, then an adjacent category in the same towns, then a region.
- Expand only when the gate metrics below hold.
- Keep geography and the sitemap honest. Only places with verified activity get indexed.
- Global work is mostly structural: currency, jurisdiction and policy-review fields, which `WorkOpportunity` already has. It is not launching in many countries.

## 2. Risks, foundations, dependencies

**Top risks**
1. **Source of truth is split.** The Lovable branch is 270 commits behind main and the sync target is unverified. Any build turn now risks re-pushing stale code. *Blocks everything.*
2. **Empty supply.** Every surface looks the same with zero providers. SEO and growth effort before supply exists produces bounces and thin-content signals.
3. **Process overhead outweighs the product.** Many PRs, audits and plans, but no completed real-world outcome yet. Coordination cost grows faster than value.
4. **Security and privacy are unverified.** Issue #164 (default-ACL leads), `saved_items`/`needs` row-level security, and preview auth #235 are all unresolved.
5. **Regulated-category exposure** if the beachhead drifts into care, electrical, transport and similar.
6. **Agent autonomy is overstated.** Prompts and docs describe leases and heartbeats; no persistent executor is proven.

**Foundations worth keeping:** `findSupply()` with ADR 001; the trust and provenance model; the consent-gated connection flow; the ingest contract; the SEO route registry (#271); the fail-closed sitemap and scope caps (#272, #276); the `WorkOpportunity` publication gates; the CI `verify` check; the control-plane docs.

**Priority dependencies:** (a) one source of truth, (b) security baseline verified, (c) first real providers onboarded, (d) minimal privacy-safe outcome analytics.

## 3. Multi-agent operating model that can actually run

**What exists today:** agents run only when a person starts a session (Lovable, ChatGPT, Grok). Each does bounded work on a branch, then a PR, then CI, then human review and merge. The control-plane docs describe the protocol, but **no persistent executor, scheduler, durable task table or heartbeat is verified**. Calling it "24/7" today would be false.

**Recommended model (achievable now):**
- **GitHub is the only shared memory.** Issues hold claims, PRs hold changes, labels hold state. One coordinator issue (e.g. #279) holds the live board.
- **Lanes with file ownership:** discovery/map, SEO/privacy, supply onboarding, security, docs. One agent per lane at a time; the claim is recorded as an issue comment with a date and expiry.
- **Every handoff uses the HANDOFF format:** SHA, files, tests, evidence, blockers.
- **Lovable's role:** read-only audits until the sync is fixed; afterwards, small UI slices on the synced branch, opened as PRs to main.
- **Humans own:** merges, publishing, database and security changes, spending, outreach, legal and pricing.

**Before calling anything "continuous":** prove a scheduled runner (e.g. a GitHub Actions cron) in a non-production setting. It must only open issues or PRs, never merge. It needs idempotent claims, a cost cap, a kill switch and an audit log. Run it 2 to 4 weeks, measuring the share of PRs accepted and the reverts. Until then it is "on-demand agents", not 24/7.

## 4. Stages, gates and metrics

| Stage | Goal | Exit gate (all required) |
|---|---|---|
| 0. Converge | One source of truth | Owner confirms Git target. Sync branch even with main through a merge PR. Ruleset active on main and the sync branch. `verify` green on the exact head. |
| 1. Safe baseline | Nothing leaks | Life List private (#271). Sitemap fail-closed (#276). #164 access matrix tested in a throwaway database. #235 closed or rejected. |
| 2. Pilot supply | Real providers | 10 or more opt-in, verified providers in one town and category, each with stated terms and a freshness date. |
| 3. First outcomes | Real completions | 20 or more requests, 50% or more get a provider reply within 24h, 10 or more completed jobs, report rate under 5%, provider would-continue 60% or more. |
| 4. Repeat | Proof it works | 2 to 4 weeks of repeat usage. Unit cost known. A second town in the same category hits the Stage 3 gates. |
| 5. Expand | Adjacent category or region | Gates met in two towns. Policy review for the new jurisdiction or category. |

**Metrics (all aggregate, no message content):** useful-result rate from `findSupply()`; request-to-reply and reply-to-completion rates; median time to first reply; share of providers still fresh after 30 days; report and block rate; real human sessions (bots excluded) per pilot locality.

**Do not use** total sitemap hits, direct visits or page views as success measures.

## 5. Human-owned boundaries
Merges to main and the sync branch. Publishing. Database migrations, row-level security and grants. Secrets and connectors. Spending. Contacting providers or customers. Pricing and legal terms. Regulated categories. Turning on AI ("Ask this place"). Enabling any scheduled agent.

## 6. First 10 tasks (in order)
1. **Owner:** confirm the Git target in Project Settings → Git and record it on issue #263.
2. **Owner:** check the main ruleset is actually enforced; add one for `Loveable/work/*`.
3. **Reviewer:** classify the 16 Lovable-only commits (keep, port or drop).
4. **Owner or reviewer:** PR merging main into `Loveable/work/safely` (merge, not rebase); `verify` green; merge.
5. **Review:** land #271 (private Life List and route registry), then #276 and #272, in an agreed order; rebase each after the previous one lands.
6. **Security:** complete the #164 access matrix in a throwaway database, read-only against production; decide on #235.
7. **Analytics:** add minimal privacy-safe outcome events: request created, reply, completed, report. Also add bot filtering. Approval needed.
8. **Research (no build):** pick the pilot town and category; record 20 or more pain signals and 5 to 10 legitimate conversations; go/no-go note.
9. **Build (after 0 to 1):** one complete provider-onboarding path for the pilot category, through existing `make`/profile, `findSupply()` and the connection flow. No new matcher or routes.
10. **Ops proof:** design, but do not enable, a scheduled read-only agent runner with a cost cap and kill switch, written up as a proposal for human approval.

## Assumptions
- The owner can reach 10 to 20 providers in one town legitimately.
- A cleaning or odd-jobs category stays outside regulated scope.
- Lovable Cloud stays the backend.
- Global ambition is a long-term direction, not this year's operating plan.
