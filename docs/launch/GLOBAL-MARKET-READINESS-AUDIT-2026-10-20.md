# Global market readiness: integration gates and evidence audit
Date: 2026-10-20
Canonical baseline inspected: main at 9269dff0fb66911733ea309fd7342d86bb60c112

## Purpose and scope

This is a read-only architecture/integration audit recorded as documentation. It does not change application code, live data, schemas, RLS, grants, credentials, or deployment. It does not certify a launch. It identifies the highest-risk gaps between existing implementation and the 31 October limited-pilot objective.

## Evidence-backed status

- The canonical repository is mattleask373-rgb/life-lived-network; main currently points to 9269dff0fb66911733ea309fd7342d86bb60c112, not the older 0c56cc2... baseline used by several open PR descriptions.
- The real findSupply() implementation in src/lib/supply-engine.ts remains the discovery authority.
- Current main already has the service taxonomy and service/locality UI foundation described in roadmap.md; that is not equivalent to the full explainable indexability policy, gated sitemaps, or a working anonymous provider enquiry channel.
- PR #173 proposes the pure indexability gate, server-rendered service/locality route integration, breadcrumbs, and gated sitemap enumeration. Its hosted Verify runs passed on its recorded head; Supabase Preview was skipped.
- PR #174 proposes the work-opportunity contract/taxonomy; its recorded Verify runs passed on its recorded head; Supabase Preview was skipped.
- PR #175 proposes a non-writing staging validator and Australia hierarchy skeleton. The proposed Australia nodes deliberately lack approved provenance/rights and coordinates, and are not import-ready inventory. Its recorded Verify runs passed on its recorded head; Supabase Preview was skipped.
- PR #176 proposes opportunity surfaces and a request-to-existing-need path. Its recorded Verify runs passed on its recorded head; Supabase Preview was skipped.
- PR #177 proposes the focused visual integration slice. Hosted Verify passed on its recorded head; Supabase Preview was skipped; manual responsive and accessibility QA remains explicitly unrun.
- Current main reports branch protection disabled. Required PR reviews/status checks and no-bypass protections therefore need repository-owner action; this audit does not change administration settings.

Run evidence (head-specific; re-check after any branch update):
- #173: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39338180847 and https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39338175614
- #174: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39335275560 and https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39330460705
- #175: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339726697 and https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339720876
- #176: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339564560 and https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39339559618
- #177: https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39419612592 and https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39416122486

## Integration risks to resolve before merging

### P0 — Protect the merge boundary

1. Enable repository rules for main: pull request required, founder/owner approval, required current Verify, no force-push/deletion, and no bot/admin bypass. The API inspection reports protected: false.
2. Treat every hosted check as evidence for the exact SHA only. Re-run Verify after conflict resolution, branch update, or replacement commits (without rewriting already-pushed history).
3. Do not interpret skipped Supabase Preview as RLS, privacy, migration, or production-data proof.

### P1 — Reconcile stale/diverged PR bases and overlapping work

At audit time, #173, #175 and #176 have 18 commits of current-main history not present in their recorded heads and are reported as diverged by GitHub's compare endpoint. Their recorded Verify success does not prove the current merge result will pass.

- #173 overlaps locality route files with #175 and #176. Resolve through a deliberate integration branch/PR order; do not merge a stale route tree blindly.
- #174 and #176 both change src/lib/work-opportunities.ts, src/lib/service-taxonomy.ts, src/lib/world-data.ts, src/routes/$country.$place.tsx, roadmap.md and docs/agents/STATUS.md. They must be reconciled into one canonical contract and one taxonomy/surface path; do not allow parallel parsers or divergent field names.
- #175 and #173 both change src/routes/$country.$place.tsx and generated route-tree/roadmap/status files. Keep one coherent route implementation and regenerate derived route output through the project toolchain rather than hand-merging generated output.
- #177 is based on the current main SHA observed in this audit, but still needs the stated 375px/1280px keyboard/focus/screen-reader checks before merge.

### P1 — SEO gate semantics must be consistent end to end

Before enabling broad crawling, prove one shared pure gate is used by:
- route metadata / robots directives;
- sitemap candidate generation and final XML output;
- internal links and canonical URL generation;
- structured data, whose entities and fields must match visible, rights-cleared content.

Only INDEXABLE should enter sitemaps. INDEXABLE_WITH_LIMITATIONS may be visible to a user but remains out of sitemaps until the policy explicitly says otherwise. Demonstration-only, unpublished, stale/cancelled, provenance-missing, privacy-blocked, and failed/incomplete reads must fail closed. robots.txt is not access control. Validate the deployed HTTP responses and crawler-visible HTML after human-approved deployment; unit tests alone are not a live crawl proof.

### P1 — Opportunity taxonomy must not imply a job board exists

- Keep declared engagement kind separate from pay status and legal employment classification.
- Never infer pay, dates, accommodation, qualifications, availability, or employer legitimacy.
- Only reviewed, rights-cleared, current, published, non-demonstration records can surface as opportunities.
- The “request a match” path must accurately state whether it creates a need or contacts a provider. Do not claim direct provider messaging unless that pathway is actually implemented and tested.
- Future partner ingestion remains disabled until source rights, market policy, rate limits, deletion/withdrawal, provenance, idempotency and human review are specified.

### P1 — Australia scaffold is not an Australia pilot

The proposed hierarchy is useful preparation only. It must remain unpublished until parentage, country/region crosswalk, coordinates, time zone, currency, authoritative source, licence/attribution, redistribution rights, retrieval time, freshness, and human review are verified. No Australian inventory exists on the evidence reviewed. A locality skeleton is not evidence of provider/event/job coverage and must not be promoted as live.

### P2 — Operational and conversion proof

The limited pilot still needs an evidence pack proving:
- signed-out visitor → canonical locality/service page → genuine possibility (or honest quiet state) → trust/provenance facts → truthful next action → observable outcome;
- contact/enquiry semantics and consent are explicit, with rate limiting, abuse handling, data retention/deletion and ownership defined;
- report/block/moderation/contact and account deletion paths have a named operational owner and tested escalation;
- 375px and desktop layout, keyboard navigation, focus visibility, labels, contrast, screen-reader announcement, and loading/error/empty states are checked on actual rendered pages;
- public routes, sitemap index and child sitemaps, robots, canonical tags and structured data are checked against a deployed environment after approval.

## Recommended execution order

1. Owner sets branch protections (human action).
2. Reconcile #173/#175 route changes with current main; reconcile #174/#176 into one opportunity contract/surface; run fresh Verify on final candidate heads.
3. Merge only after independent human review, required Verify and conflict-free evidence.
4. Complete #177 manual accessibility/responsive QA.
5. Prove deployed SEO/route/sitemap behavior and the truthful contact journey in a limited, explicitly scoped pilot.
6. Keep Australia unpublished until the staged data passes source-rights and human-review gates and real records are separately supplied.
7. Make the go/no-go decision against the P0 checklist; scope down rather than relax safety or fabricate supply.

## Non-goals / invariants

No merge, deployment, production data write, schema/RLS/grant change, secret activation, external feed activation, invented records, second discovery engine, or claim of global inventory coverage is authorized by this document.
