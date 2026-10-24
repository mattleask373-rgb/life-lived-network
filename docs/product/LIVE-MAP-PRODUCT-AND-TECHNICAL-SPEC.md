# Live Map — Product and Technical Specification

**Status:** design contract only; no new public layer or publication surface is authorized by this specification.  
**Product rule:** the map is the primary spatial index for eligible activity. Lists, detail pages, Journey and profile views are complementary projections over canonical records, not separate matching engines.

## 1. Product promise

Help a resident or traveler answer: “What real, current, appropriate thing can I do here, or what help can I offer or ask for?” The user should understand the state of a place quickly, take an intentional action if useful, and comfortably put the phone away.

The product must not claim that a capability means willingness, that a trip means availability, that living in a place means serving it, or that a profile preference proves eligibility.

## 2. Layer model

Layers are independently filterable, but share canonical place IDs, eligibility decisions, accessibility and privacy rules.

| Layer | What may be shown | Publication/privacy gate |
|---|---|---|
| Listings / experiences | Eligible published walks, community gatherings, food/music/nature activities, stays and practical services | Published state, current/future-valid timing, source provenance/rights, moderation and category qualifications |
| Needs | Current open requests for help or knowledge | Global-public needs only in anonymous paths. local_discovery requires an authenticated, verified exact-place boundary and compatible list/detail/matching paths |
| Offers | Opt-in skill/time/tool/knowledge offers with explicit terms | Owner consent, current availability statement, moderation; never imply regulated qualification without proof |
| Moments | Real participant-submitted photo/note with place and time context | Explicit visibility/consent, rights, moderation, location minimisation; no private moments in public search |
| People | Time-bounded visible presence or voluntary availability | OFF by default; explicit opt-in, coarse/limited precision, expiry and easy revoke; never reveal exact live location or build a people-tracking map |
| Daily-life signals | Markets, tool libraries, shared kitchens, recurring community information | Source provenance, update cadence, local permission and clear “last checked” status |
| Context overlays | Terrain, accessibility, weather/light, quiet/lively context | Only show sourced, dated information with uncertainty; no precise personal route history |

Private messages, saved records, private Journey details, personal memories, private profiles and hidden/reported records are not map layers.

## 3. Local Mode and Traveler Mode

Both modes use the same underlying eligible records, shared privacy enforcement and common interaction model. Mode changes defaults, not authorization.

**Local Mode**
- Starts at the user-selected supported locality or another explicitly chosen place; background location is not required.
- Prioritises practical local supply, needs/offers the person is authorised to see, ongoing community information and saved preferences.
- Provides controls for local visibility, locality membership requests and local stewardship workflows only when those workflows are implemented and reviewed.
- Does not give a user access to private local_discovery rows merely because their profile says they live there.

**Traveler Mode**
- Starts with a chosen arrival place and a user-selected time horizon; automatic precise location is optional.
- Offers gentle orientation, current eligible places and practical knowledge; makes contribution optional and explains how to participate respectfully.
- Temporary presence must be explicit, time-bounded, revocable and privacy-preserving.
- Does not expose “people from your last city” or cross-place identity links without opt-in and a separate privacy/safety review.

A traveler may choose a place for a longer stay without being automatically granted local membership. A local may browse another place without gaining access to that place's restricted records.

## 4. Personalisation rules

Permitted signals are explicit user choices: chosen place, selected language, selected categories, optional budget band, indoor/outdoor preference, time available, accessibility filters, local/traveler lens and saved filters.

Constraints:
- Do not infer mental state, loneliness, vulnerability, age, disability, income, or relationships from passive activity.
- Do not use background location for retention nudges.
- Do not personalise by hidden popularity, engagement maximisation, sensitive traits or private message content.
- State why a result appears when ranking is not obvious; offer neutral filter reset and “show all eligible” controls.
- If a preference removes every result, show an honest quiet state and explain which filter can be relaxed. Never invent a match.

## 5. Interaction path

From a pin or cluster:
1. Show a concise label, category, locality, timing/freshness and why the record is eligible.
2. Open an accessible summary card with clear visibility, terms, cost/free status, host-provided facts and uncertainty.
3. Provide explicit actions appropriate to the record: open detail, save privately, ask/respond, offer help, report or hide.
4. Require user review before publishing or sending a message. Never create or contact someone on the user's behalf from a map suggestion.
5. Reflect success/failure from the server. A failed write must not be shown as saved/published.
6. Return to the same map extent, filters and layer when navigating back.

Cluster selection and keyboard interactions must have non-map alternatives. List/map mode must use identical eligible records and clear loading/error/empty/partial states.

## 6. Density and geography

**Dense city:** cluster pins deterministically by viewport/zoom, use progressive disclosure, bound server requests and render stable pages. Never imply a capped sample is the complete list. If counts/pagination are incomplete, label the result partial or fail closed as defined by the data contract.

**Sparse village:** do not show empty grids or generic fabricated recommendations. Show the few current eligible records, practical categories and an honest statement that little is recorded. Allow direct contribution only with the same moderation/privacy gates.

**Hierarchy:** continent/country/region/area/city/town/village/neighbourhood to canonical locality. Parent selection and descendant expansion are server-owned. A query too wide returns an explicit scope-too-wide recovery, never a global fallback. Date-line-crossing bounds must be tested using the canonical geospatial logic.

## 7. Technical contract

- Use the existing server-owned world reader and canonical place index for public map entries.
- Preserve one matching authority: findSupply() for needs-to-supply matching and findOpportunitiesForPerson() for opportunity matching. The map must not implement a second scorer.
- A record must pass publication, freshness, moderation, source/rights, qualification and authorization checks before it enters the client response.
- Keep query sizes, fan-out, pages, retries, payload, time and cost bounded. Use deterministic order and immutable-ID deduplication.
- A backend error, missing collection, missing exact count, cap hit or incomplete scan must remain error/partial/unknown—not become a successful empty result or broader query.
- Treat client place IDs as hints only for authorization. RLS/server policy must independently enforce access on direct table/API and RPC paths.
- For local_discovery, use the reviewed authenticated server path on a request-bound user client after membership RLS is proven. Do not use service-role reads as a browser fallback. Until that end-to-end path is accepted, anonymous readers expose only explicitly public needs.
- Keep private memory and profile fields out of matching, discovery, sitemaps and AI context.

## 8. Offline and low bandwidth

Initial offline contract:
- Cache the app shell and only explicitly public, eligible, non-sensitive records chosen by the user.
- Show “last updated” and offline/stale status; never imply that cached availability is live.
- Do not cache private needs, messages, precise location, personal profile data or restricted memberships in generic shared offline packs.
- Queue writes only if the server can reconcile idempotency and authorization safely; otherwise disable writes offline with a clear explanation.
- Prefer text and compressed thumbnails, lazy-load images, preserve a useful text/list alternative, and avoid blocking on map tiles.
- Offline region packs, background sync, SMS and chat bots require separate privacy, conflict, accessibility and abuse design before implementation.

## 9. Accessibility and calm interaction

- Fully operable by keyboard without requiring drag/pinch; visible focus and logical focus restoration.
- Screen-reader names for layers, pins, clusters, filters, map extent, results count and loading/error changes.
- Do not communicate category or state through colour alone; ensure contrast and minimum touch target sizing.
- Respect reduced motion, browser zoom, screen magnification and system text size.
- Every map interaction has a list/search equivalent; keep language plain and avoid icon-only destructive actions.
- Do not use auto-refresh that shifts focus or moves the viewport unexpectedly.
- Manual QA required on small mobile viewport, keyboard-only, representative screen reader, slow network, offline resume and date-line bounds.

## 10. Acceptance criteria

A build is not complete until:
- list and map show the same authorized eligible record set and expose pagination limits honestly;
- public vs local_discovery needs are isolated by database and server authorization, not only UI filters;
- a stale, blocked, reported, demonstration, unlicensed or unqualified record cannot appear as confirmed eligible;
- no result and read failure have different truthful UI states;
- write/response failures are visible and retry-safe;
- dense-city and sparse-village behavior both work without fabricated content;
- Local Mode and Traveler Mode do not change permission;
- offline mode labels cache age and avoids sensitive cache leakage;
- keyboard, screen-reader, contrast, mobile and date-line tests pass;
- a user can reach a useful action calmly and leave the app, without streaks, urgency or endless engagement loops.

## Implementation sequencing

Do not expand public surfaces until Gate 0 and Gate 4 close. Then implement/review the data and authorization contract first; parity of map/list next; accessibility/low bandwidth next; opt-in visibility and offline enhancements only with their own privacy gates.
