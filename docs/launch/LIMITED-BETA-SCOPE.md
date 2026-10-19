# Limited Beta Scope — Living World / Real World Atlas

**Status:** Proposed scope for founder approval. Not a production readiness assertion.
**Evidence baseline:** repository `main` at `0c56cc299825dea5996323506e7a1cc9266975c8` (19 October 2026); current CI and live service behaviour must be rechecked before launch.

## Purpose

Validate whether people can use a single locality-first product to find a genuine real-world possibility, contact the relevant person or organiser, and complete an activity safely. The beta should test the core value loop, not imply a worldwide inventory or general-purpose marketplace is already operational.

## In-scope pilot capabilities — only where verified

- Choose and explore a supported locality; discover the activity the system can actually evidence.
- View real listings and opportunities with clear source, freshness and verification states where those fields are available.
- Post a need through the authenticated need-creation flow after PR #169 / integration PR #172 is reviewed, verified and merged.
- Offer time or capability, with explicit service-area semantics. A person's residence is not automatically a service area.
- Save items and use existing journey / Road Trip planning where the relevant flow passes the release walkthrough.
- Report, block, and route abuse into a staffed moderation/support process before inviting external beta users.

The above is a scope proposal; every item must pass the release checklist on the exact candidate build before it is advertised.

## Out of scope / explicit exclusions

- **No global launch claim.** Technical reuse across markets does not mean local data, partners, support, licensing or law have been validated in every country.
- **Australia is not live.** No Australian locality data is being loaded as part of this work.
- **Conversation security (#162) is excluded from beta claims** until disposable-database proof is available and independently reviewed. Do not market private messaging as security-verified or make it a dependency of the demo.
- No claim of real-time transport routing, route optimisation, live event coverage, booking confirmation, availability guarantee, identity guarantee, or earnings estimate unless a connected provider or actual workflow demonstrably supports it.
- No AI-generated supply or invented people, jobs, venues, events, testimonials, community activity, demand or traction.
- No payments/escrow, employment screening, visa advice or guarantee that any work-exchange arrangement is lawful.
- No production schema/RLS/grant changes or data seeding as a shortcut to make the beta look busy.

## Minimum launch gates

1. Exact build commit identified; install, lint, tests, and production build pass.
2. First visit, locality selection, discovery, details, ask/offer, contact handoff, signed-out state, session failure and empty/error/retry states manually tested on desktop and mobile.
3. Separate accounts prove that private records are not visible to another user; do not substitute unit tests for RLS proof.
4. Block/report/moderation paths work and have a named human owner, response target and escalation route.
5. Every shown opportunity is real, permissioned, current enough for its claimed use, and attributable; stale or unknown records are labelled or withheld.
6. Legal/privacy/terms review completed for the pilot jurisdiction; high-risk employment/volunteering arrangements have explicit policy handling.
7. Rollback/disable plan and user-support contact are ready.

## Demo path when supply is sparse

1. Open a supported locality and show real data counts and provenance.
2. If it is quiet, state that honestly and demonstrate the next useful action: widening the area or contributing a real listing/need.
3. Walk through a real need with its structured terms and show what is known versus unknown.
4. Explain how the canonical `findSupply()` would return evidence bands without inventing capacity or availability; use labelled test fixtures only in a development environment.
5. Do not imply that a demo record is live or that an untested account-to-account conversation is secure.

## What to measure

Prefer completed real-world outcomes over time spent in app: validated listing count and freshness, successful host/provider onboarding, meaningful enquiry response rate, completed activities reported by both sides where possible, report rate, time to moderation resolution, and the number of locality searches with no result that still lead to a helpful next action. Publish denominators and date ranges. Do not report unverified counts as traction.
