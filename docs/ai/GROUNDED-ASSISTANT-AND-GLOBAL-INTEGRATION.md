# Grounded AI and Global Platform Integration

**Status:** Architecture and delivery contract; implementation intentionally staged.
**Baseline reviewed:** main at 14e409e90a027305902f381de3d0a9fbd912dc71 (2026-10-20).
**Purpose:** Make Real World Atlas / Life Lived Network ready to expand by place, language, source and capability without creating parallel product logic or allowing AI to become a source of invented facts.

## Product decision: one interface, one application

- The canonical user-facing product remains this repository's web application.
- Grok is the visual/product direction to build toward; its design should be implemented in the current application and shared components, not as a second frontend with a separate backend.
- Current main includes Grok-inspired home redesign work (latest commit: “Applied Grok redesign to home”). Extend the current implementation; do not reintroduce older visual branches wholesale.
- Lovable remains an existing editing/sync path in the current setup, not the product's source of truth for domain rules. GitHub main, reviewed PRs, tests and documented contracts define what is integrated.
- If “Grok's new app” means using the external Grok product itself as a separately hosted runtime frontend rather than implementing Grok's design in this app, that is a separate architecture decision. It requires an explicit choice of hosting, authentication/session model, API boundary, ownership and migration plan. Do not silently create a second app.

## Existing foundation (verified in source on the baseline)

- Canonical place hierarchy and place-level timezone/currency fields: src/lib/places.ts and server-side place index/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Canonical possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; the doSomethingToday consumer uses it.
- Public listing retrieval/normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Existing AI-assisted drafting: src/lib/draft-assist.functions.ts + src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves nothing automatically.
- Generic locality and service-locality routes already exist on main; current SEO gate/sitemap integration still needs exact-head reconciliation and verification.
- WorkOpportunity, source-ingestion and new indexability branches are not considered integrated merely because they exist as open PRs.

## Target architecture

    Grok-inspired, accessible web UI
      ├─ Place / locality / service / event / opportunity surfaces
      ├─ Search, “do something today”, “I have X hours”
      └─ “Ask this place” (read-only assistant, staged after prerequisites)
              |
              v
    Existing server functions + canonical public retrieval
              |
              ├─ Canonical place hierarchy + shared taxonomy
              ├─ Published, current, rights-cleared records only
              ├─ findSupply() for need-to-possibility discovery
              └─ groundedMatch() for bounded, explainable ranking
              |
              v
    AI gateway (server-only, bounded input/output, budget/rate controls)
              |
              v
    Answer with record-backed citations, freshness and uncertainty

The diagram is a target contract, not a claim that the “Ask this place” assistant is already implemented.

## AI rollout order

### A. Keep the existing draft assistant safe

- Continue treating the person's own text as the source of truth.
- Missing facts remain questions; the model must not add names, prices, availability, qualifications, dates or addresses.
- The user reviews and explicitly submits any draft; model output is never published automatically.
- Keep credentials server-only. Do not expose gateway keys or internal reasoning to the browser.
- Add abuse/rate/cost controls before materially expanding public AI usage.

### B. First new AI feature: read-only “Ask this place”

Implement only after the current data and auth seams have an owner-reviewed contract.

**Request contract**
- Accept a canonical place identifier/slug and a bounded plain-language question.
- Validate and normalise the request server-side; do not trust client-supplied record payloads.
- Retrieve a bounded set of records through existing server-side data paths. Do not make a second discovery engine or query private tables with elevated credentials just for AI.
- Exclude demonstration, unpublished, expired, blocked, unreviewed and rights-uncleared content according to the relevant record contract. If the data path cannot prove eligibility, omit the record.
- Keep the initial scope read-only. No writes, external actions, messages, booking, contact or submission on behalf of the user.

**Answer contract**
- Answer only from the retrieved record bundle and explicitly supplied canonical place facts.
- Attach a source link/record identifier and freshness/status information to every concrete local claim where available.
- If no records support an answer, say the information is not recorded and suggest a real next step; never fill the gap with plausible-sounding local knowledge.
- Distinguish published fact, record owner statement, derived formatting and model explanation.
- Treat record text and user questions as untrusted input, not instructions. The model cannot change its rules because a listing tells it to.
- Bound input, record count, per-record text, output length and request duration. Fail closed on missing provider configuration or uncertain access.
- Do not persist prompts or answers by default. Any later retention, analytics or training use requires a separate privacy review and explicit decision.

**Operational gates before a public model endpoint**
- Document provider/model, data sent, retention posture, cost owner and fallback.
- Establish rate limiting and budget ceilings at a shared server boundary; gateway 429 handling alone is not a complete abuse-control design.
- Add tests for prompt injection in record text, empty/stale/demo-only localities, cross-place isolation, malformed input, model timeout, provider refusal and citation completeness.
- Use a fixed evaluation set with expected source records and “not enough evidence” cases.
- Human approval required before enabling the feature publicly or changing data access.

### C. Only then expand assistant capabilities

1. Explain a selected result, with source and freshness.
2. Help draft contributions using the existing review-before-submit pattern.
3. Suggest data-quality checks (staleness, duplicates, missing provenance) for human review.
4. Add translation while preserving dates, currencies, eligibility, source claims and uncertainty.

Do not start autonomous publishing, unrestricted agent tools, live partner ingestion or model-generated inventory as part of this phase.

## Global market contract

Every market uses the same application and contracts. A market is not live just because a country code or map pin exists.

Before records become public, validate:
- canonical parent/child hierarchy and ISO country code;
- explicit currency and integer minor-unit money semantics;
- IANA timezone, locale/date formatting and language fallback;
- shared service taxonomy plus local distinctions (employment, casual work, volunteering, skills exchange);
- source identity, licence/rights, attribution, review status and freshness;
- moderation, reporting, blocking, privacy and safety escalation;
- idempotent staging/import, duplicate handling, dry-run report and rollback;
- public page indexability using the same explainable gate as sitemap enumeration;
- real stewards and a process to correct or retire records.

Australia (including Byron Bay, Agnes Water and Port Douglas) remains **not live** until exact hierarchy, provenance, rights, timezone and real-record review are approved. Staged candidates must be clearly marked not_published.

## Interface integration rules

- Keep the current application and existing component system; migrate by surface, not by replacing the repository with a prototype.
- Design tokens, card semantics, map, place picker, route navigation, empty states and keyboard focus must be consistent across home, locality, service, journey and detail views.
- A design branch is not accepted on source inspection alone: verify rendered contrast, keyboard-only flow, screen-reader names, 375px and desktop overflow, reduced motion where applicable, and no nested interactive controls.
- Cards show only supplied facts: pay and currency, dates, duration, accommodation, conditions, source/credit and demo state remain distinct; missing fields stay missing.
- Do not introduce provider profiles, analytics vendors or a new enquiry table as incidental work in the visual integration.

## Agent coordination and change control

Every work item must have:
- one owner/lead, one purpose and explicit non-goals;
- exact base SHA and the files/contracts it owns;
- prerequisites and conflicting PRs;
- testable acceptance criteria and exact-head Verify evidence;
- security/data/privacy review flags;
- a human decision list and rollback/disable plan when relevant.

Parallel work is allowed only across non-overlapping surfaces/contracts. Do not stack a new feature onto a stale or competing branch without stating the dependency. Before integration, compare each PR against current main, salvage unique changes, and close superseded branches rather than merging stale histories.

No autonomous merge/deploy, production database writes, schema/RLS/grant changes, secrets, live partner activation or publication-policy weakening.

## Immediate execution sequence

1. Reconcile the current-main design/accessibility PR and run exact-head CI; complete browser/manual checks.
2. Choose one WorkOpportunity contract branch and one downstream staging/surface chain. Close or clearly mark duplicate alternatives.
3. Reconcile service/locality indexability and sitemap enumeration onto current main; prove metadata and sitemap use the same gate.
4. Stage only reviewed market candidates; do not publish unverified Australian records.
5. Specify and test the server-side grounded-assistant context boundary before building the public “Ask this place” UI.
6. Add the assistant behind an explicit feature gate only after rate/cost controls, citation evaluation and security review pass.
7. Run a core-journey release checklist and record remaining human decisions.

## Definition of done for this phase

- One reviewed UI direction implemented in the canonical app, not a parallel prototype.
- Current-main CI is green on the exact integration commit.
- Locality/service pages and sitemaps share a tested indexability contract.
- Work opportunities remain unpublished until their complete rights/review/publication contract passes.
- The assistant can only use eligible records, cites evidence, reports uncertainty, has bounded cost/abuse controls, and has no write tools.
- Each proposed new market has a completed readiness record; no market is described as live without evidence.
- docs/agents/STATUS.md and roadmap.md reflect current evidence and explicit blockers.
