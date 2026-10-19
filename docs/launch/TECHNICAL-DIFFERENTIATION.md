# Technical Differentiation — Living World / Real World Atlas

**Audience:** engineering partners, potential investors, Google technical meeting.
**Status:** grounded architecture summary; all performance, security and traction claims remain unverified unless accompanied by test evidence.

## Product thesis

A place-first interface for what a person can genuinely do, offer, learn, discover or create in the real world. Success is the real activity taking place, not increased screen time. This is intended to connect social discovery, contribution, paid opportunities, experiences and journeys without building a competing infinite-feed mechanic for every category.

## Architecture facts visible in the repository

- **One canonical possibility engine:** `src/lib/supply-engine.ts` exports `findSupply()`. Repository `AGENTS.md` explicitly prohibits a second engine. Do not add a separate marketplace matcher, event ranker or parallel "AI result" path.
- **Evidence bands rather than an opaque relevance score:** the engine models kinds of possible supply and returns explanatory facts/caveats. "Can do", "open to opportunities", "available at a specified time", an offer, and an actual journey overlap are different facts.
- **Place scope is first-class:** canonical place IDs/hierarchy define the locality query; service coverage is explicit. Home locality/residence is not inferred as a service area, and "travelling through" is not equivalent to service coverage or live presence.
- **One normalized world shape:** listings and other source types are normalized into the shared `WorldEntry` representation so the UI can present varied real-world possibilities consistently without asserting every source has equivalent evidence.
- **Source provenance and freshness are product semantics:** source, update/confirmation age, verification and unknowns influence whether a record can be surfaced. A stale or missing value must not be converted into a positive assertion.
- **Sparse localities remain honest:** quiet is a meaningful state; the UI can suggest expanding scope or contributing something real instead of synthesizing density.
- **Existing application stack:** React 19, TanStack Start, Vite, TypeScript, Tailwind v4, Supabase, React Query and Vitest are reflected in the repository manifest. The presence of these dependencies alone does not prove production capacity or operational maturity.

## Why this could matter

Many products specialise in one transaction or content type: accommodation, work exchange, events, creators, local services, or social following. Atlas is designed around the user's place and intention, then connects across those categories through a common model of evidence and availability. A journey can combine a verified opportunity, nearby experience, event and community project if—and only if—the sources provide enough evidence to justify those connections.

## Defensible claims vs claims not yet earned

**Defensible from code/design (still subject to candidate-build verification):**
- One canonical supply engine is present.
- Unknown is intentionally distinct from zero or absence.
- Place, explicit service area and journey context are represented in the domain model.
- The app has maps/locality, need/offer, saved-item and journey-related routes/components.

**Do not claim without new evidence:**
- global live data coverage, network effects, scale, uptime, latency, superior recommendations, verified identities, security-proof for conversations (#162), production-grade incident response, revenue, market traction or active-user counts.
- that every map object can be booked, contacted or is still available.
- that a prototype route/provider integration is live when its credentials are absent.

## Verification that makes the differentiation credible

1. Unit tests for matching evidence bands, explicit service area, stale/fresh availability, and "unknown is not false/zero".
2. Fixture-free production build and a controlled development demo with fixtures clearly marked.
3. A disposable-database security test matrix for private routes, RLS, block/report behaviour and cross-account access.
4. A source-rights ledger with attribution and refresh rules for every external feed.
5. An outcome-based pilot report with sample sizes, dates, locality scope and methodology.

The defensible moat is not a claim that a matcher is impossible to copy. It is the combination of canonical locality scope, evidence/provenance discipline, a multi-category real-world model, and a measured loop from intention to completed activity.
