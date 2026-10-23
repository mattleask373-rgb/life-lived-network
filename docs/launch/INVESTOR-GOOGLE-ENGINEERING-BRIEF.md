# Investor & Google Engineering Brief

**Purpose:** provide a precise discussion guide, not a traction deck. Replace every unknown with evidence before making a claim.
**Product names:** Living World / Real World Atlas / Life Lived Network remain inconsistent across repository artefacts; founder must approve one public name before external distribution.

## One-minute technical overview

Living World is a locality-first platform for real-world discovery. It aims to connect genuine people, places, needs, offers, work opportunities, skills exchanges, experiences, community activity and journeys through one consistent discovery model. Its differentiator is not the existence of a map or a chatbot; it is the discipline of grounding suggestions in canonical locality scope, explicit service coverage, source provenance, freshness and what is actually known.

The repository contains a canonical `findSupply()` engine with named evidence bands and shared world-entry normalization. It is designed not to confuse capability with willingness or confirmed availability, not to turn missing data into zero, and not to manufacture activity in a quiet locality. These behaviours must be re-verified in the release candidate before being represented as production guarantees.

## Demo sequence (5 minutes)

1. **Open a real supported locality.** State the date, locality and source of the data. Show current counts only if measured from the active environment.
2. **Explore the map and a result.** Show source/freshness/trust metadata. Distinguish live record, imported record, demo fixture and unknown field.
3. **Show a quiet locality honestly.** Explain why no result is not evidence that an activity does not exist; demonstrate widening the place or offering a real contribution.
4. **Show a need and its validation boundary.** Explain strict payload validation and canonical place normalization in PR #172, pending fresh CI/review/merge.
5. **Explain cross-category potential.** Walk through how work, an experience and a community activity might be composed into a journey—only when their underlying records, time and location support the claim.
6. **Close on evidence, not usage theatre.** Show the tests/checks, open release gates and the planned pilot measures; do not invent user counts or testimonials.

## Eight questions for Google engineers

1. **Maps data rights and presentation:** For a map-first surface that mixes first-party community records with Google-provided place/route content, which exact Google Maps Platform product and contractual terms would apply? What content can be stored, for how long, and where must provider attribution or branding appear?
2. **Places integration boundary:** What is the recommended architecture for Places lookup/autocomplete and canonical place IDs when the platform's own locality hierarchy and community-authored content must remain provider-neutral? How should we handle source refresh and user correction?
3. **EEA and regional terms:** How do Google Maps Platform product/terms differences by billing region affect one application serving the UK, EEA and later Australia? Which terms require separate product or data-flow decisions?
4. **Map performance:** Given a large set of public place-level items but strict bounds and provenance checks, what map rendering, clustering and query architecture would Google recommend, and where would server-side spatial indexes become necessary?
5. **AI grounding and tool use:** What patterns would you recommend for journey suggestions that must cite/identify each underlying real record, disclose missing facts, and never fabricate availability, host approval, pricing or opening hours?
6. **Security boundaries:** What threat-model and test evidence would your engineers expect before an application with identity, private messages, location preferences, host listings and user-generated work opportunities could enter a public beta? How would you prove tenant isolation and block/report enforcement?
7. **Abuse and operational scale:** Which abuse signals, quota controls, review queues and observability patterns should be built before onboarding multiple markets with different languages and legal expectations?
8. **Data / cost architecture:** How would you design cache boundaries, provider budgets, update cadences, and a graceful degraded mode so external map/event/transport services cannot create fake content or take down the core discovery path?

## Current technical posture to state plainly

- Canonical engine: `src/lib/supply-engine.ts`; do not create a second matcher.
- Stack evident in repository: React 19, TanStack Start, TypeScript, Vite, Tailwind v4, Supabase and React Query.
- PRs #157, #163, #170 and #129 are merged into current main (confirmed by GitHub state).
- PRs #154 and #169 remain open; draft integration PR #172 combines their behaviour on current main and requires fresh Verify + independent review.
- PR #171 is the documentation/launch plan PR.
- Conversation security #162 is excluded from beta claims until disposable-database proof exists.
- Australia remains a prototype plan only; no live Australian inventory is loaded by this cycle.
- No verified active-user, traffic, conversion, uptime, revenue, partner, or global-coverage metrics are supplied by this engineering review.

## Google data-policy references to read before selecting an API

Google's current Places API policy page describes public Terms of Use and Privacy Policy requirements, map/brand attribution and restrictions on pre-fetching/caching/storing Places content, with an exception for place IDs. Requirements vary by product and region, so obtain legal/product confirmation before implementation:
https://developers.google.com/maps/documentation/places/web-service/policies

## Investor questions to answer with evidence

- What narrow first locality has enough real supply to be useful on day one?
- Who provides and verifies inventory, and who responds to safety reports?
- What is the first repeatable acquisition channel for hosts/providers and participants?
- Which event/transport/place data rights allow commercial reuse, and what do they cost?
- Which revenue tests are hypotheses versus observed results?
- What must be proven in the invited pilot before opening another locality?

This brief is deliberately not a claim of partnership with Google or any provider.
