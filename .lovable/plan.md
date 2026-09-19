# Human Possibility Engine v1 — reconciliation and smallest completion slice

## Audit outcome

The permanent loop already exists and will be extended, not replaced:

- **Person and capability:** profiles, separate role/skill/qualification/experience facts, service areas, explicit availability, opportunity preferences, contribution preferences, visibility and freshness.
- **Need:** one reusable Need model for paid work, help, community projects, volunteering and exchange.
- **Matching:** one pure deterministic supply engine plus its reciprocal reading for person → Needs. Results are labelled and explained without an opaque score.
- **Connection:** explicit offer/invite, accept/decline/withdraw, contextual conversation, participant-only access.
- **Preserved foundations:** authentication, access rules, Living Map, listings, Life List, Journey Engine, design language, geography and the server data boundary.
- **External sources:** there is a normalization seam, but no live provider ingestion currently exists. This slice will make real source photography compatible with future adapters; it will not fabricate or scrape events.

Important gaps found:

- Qualification requirements are displayed but not yet enforced as a hard constraint in both matching directions.
- Need → Person matching does not consistently apply capability freshness; unknown availability is labelled, but diagnostics are not structured.
- Blocking/reporting is absent, and current per-fact visibility rules need tightening at the data-access level.
- Acceptance fixtures do not yet cover the requested Sarah, David, traveller Alex, Maria exchange, blocked/reported/private-journey cases as one coherent suite.
- Activity categories still use platform-dependent emoji.
- Listings cannot carry authentic source photos, so the detail view always shows a placeholder.

## Build

### 1. Reconcile matching into one evidence model

- Add shared deterministic match evidence used by both Need → Person and Person → Need paths.
- Record match type, passed constraints, failed constraints, unknown facts, reasons, freshness and verification signals.
- Enforce actual-data hard constraints: private visibility, stale/expired capability, required qualification, service area, explicit time conflict, and blocked relationships.
- Keep unknown availability explicitly unknown; only an overlapping current window can be described as available.
- Keep journey matches distinct and require explicit travelling-through context plus travel-opportunity preference; route presence alone remains insufficient.

### 2. Add the minimum safety boundary

- Add owner-managed blocks and participant reports with grants, row-level access rules and indexes.
- Exclude blocked relationships from authenticated reciprocal discovery and prevent new connections between blocked people.
- Add quiet Block and Report actions to conversations; blocking closes the practical connection path without creating a public reputation score.
- Tighten capability, service-area, availability and contribution read rules so `private` facts cannot leak through direct data access.

### 3. Complete the human-loop fixtures and tests

- Add clearly marked test-only Sarah, David, travelling Alex, Community Garden and Maria exchange scenarios.
- Cover local cleaner, reciprocal cleaning opportunities, gardening, journey matching, required qualifications, unknown availability, stale data, block exclusion, private journey and skills exchange.
- Add tests for safety transitions and structured development diagnostics.
- Keep all fixture data outside production reads.

### 4. Replace emoji with an authentic visual language

- Replace the eight emoji categories with a small, consistent line-icon set already available in the project.
- Use the same icons on map pins, cards, activity summaries and detail views.
- Preserve existing layer colours, compact density and Living World styling; no redesign.

### 5. Support real event photography without inventing it

- Add optional, source-attributed listing photos to the normalized world entity.
- Render a compact swipeable/scrollable photo strip in event details only when real photos exist; otherwise retain the restrained placeholder.
- Carry source URL/credit metadata so future provider adapters can preserve provenance.
- Do not generate people, scrape “What’s On Bristol”, or add a provider integration in this slice.
- Reuse existing profile photo data in person-facing match cards when a real user photo exists; otherwise use a neutral initial/avatar, never an AI face.

## Security and data flow

- Every new public table receives explicit grants before row-level rules.
- Blocks are private to the blocker; reports are visible only to their reporter and trusted server-side handling.
- Exact home and live journey coordinates remain absent from public discovery.
- Matching stays bounded by indexed place/category/capability retrieval before detailed evaluation.
- Connections remain participant-only; no contact details, followers, likes, rankings, automated messages or engagement feed.

## Verification

- Run focused matching, freshness, policy, connection and safety tests, then the full test suite.
- Run type checking, linting and the application build.
- Check the map, activity cards, event detail photography, Need results, reciprocal Help view and Conversations at desktop and mobile sizes.
- Confirm signed-out privacy states and authenticated flows where an available test session permits it.

## Deferred

Live Bristol/provider ingestion, image uploads, global taxonomy, payments, booking, notifications, realtime chat, global credential verification, route optimisation, AI matching and any separate graph infrastructure remain outside this slice.
