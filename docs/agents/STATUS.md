# Agent System Status — 2026-10-21 (Grok redesign integration / global integration phase)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `8d79247991187bf64813cf72e3ec75aeb508e2e9` (latest observed 2026-10-21 00:23:29 UTC).
- Since the earlier `006a98c...` baseline, three commits (`fea27ff`, `8801a50`, `30c2877`) improved PlacePicker/PlaceSearch, then three more (`eb54b10`, `9c4a9e9`, `8d79247`) added an explicitly unavailable “Ask about this place” placeholder and its no-answer contract/test to the locality page. It remains a disabled placeholder, not an active assistant endpoint.
- **Verified governance concern:** ruleset [#24946178](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178), “living World - protect main”, reads `enforcement: disabled`. The branch-protection endpoint returned 403 to this connector, so any separate legacy protection cannot be confirmed. Have a repository administrator verify and enable the intended required PR/review/Verify controls. The Lovable snapshot equals current main, but the actual Project Settings → Git sync destination still cannot be proven from that fact; confirm it targets a non-main branch before any more editor writes.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- A disabled “Ask about this place” placeholder and an always-unavailable state contract now exist on the locality page. They make no model call and carry no answer; no active read-only assistant endpoint is confirmed. Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction and active integration queue — 21 October 2026, 00:30 UTC

This is the latest verified cross-agent snapshot from GitHub. The branches below remain review candidates, not production baselines.

### Design and accessibility
- **PR #211 — Grok foundation:** open draft at head b492c262d6ea73f0f2028300db96c41ee0b6c289. A non-rewriting merge commit brought current main 8d79247991187bf64813cf72e3ec75aeb508e2e9 into the candidate as first parent and retained prior head e7b732d25cd951f3ab3c1007257442563e361336 as second parent. Current main compared with the candidate is 24 commits ahead / 0 behind; the review diff remains the same 13 design/reference files with no overlap with the six current-main changed paths. Exact-head Verify passed in [run #39521447625](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521447625) and [run #39521441841](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521441841). Still draft; human visual, keyboard, screen-reader, photo-provenance and responsive QA are outstanding.
- **PR #213 — Journey / Road Trip:** open draft at head a96a8f491db47328b886bfde97aff3704afdfe14. Updated onto the refreshed #211 parent without overlapping its three route/test files. Exact-head Verify passed in [run #39521649010](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521649010) and [run #39521643610](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521643610). It remains dependent on #211 and must not be treated as accepted until its parent receives human review.
- **PR #220 — map/list synchronization:** open draft at head 6a50f7d3d390c7e3af33103accf65fc0f340febe. Current main was brought in as first parent; previous head e8fd148fa0223707fd317b80b19a47944c0bf1a2 remains in history. The diff remains three files: src/routes/index.tsx, src/lib/map-list-sync.ts and its tests; current-main changed paths do not overlap. Exact-head Verify passed in [run #39521546086](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521546086) and [run #39521540270](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521540270). This candidate is independent of #211. Mobile/tablet/desktop and keyboard QA remain.
- **PR #216:** closed unmerged and superseded; do not treat it as integrated.
- **PR #221 — source-refresh health:** open draft at head 7352f86d464da447a6ba0b579bf98f6cd7ddc338, based on current main 8d79247991187bf64813cf72e3ec75aeb508e2e9. Adds deterministic source connection health labels to the authenticated admin/moderator-only /sources panel, with unit tests. Exact-head Verify passed in [run #39521313627](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521313627) and [run #39521311442](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39521311442). Browser/accessibility QA and human review remain; it is operational status, not a live-feed scheduler or public feature.
- **PR #210 — shared handoff:** open draft documentation PR. Its branch has now been refreshed onto current main via merge commit 51fe0467e680742c868a360baf94e46c9a2d537a; this snapshot is being updated in that branch, not written to main.
- **Original Grok source:** the reported grok-workspace.zip is not present as bytes in this repository. The SHA-256 in prior handoff notes is reported provenance only and has not been independently recalculated. Complete visual parity cannot be claimed until the source archive/screenshots are available.
- **Latest main addition:** commit 8d79247991187bf64813cf72e3ec75aeb508e2e9 adds an “Ask about this place” UI placeholder. The component is disabled and always returns an unavailable state; it makes no model call and is not a functioning public assistant.

### Work opportunities, ingestion and SEO
- There are competing open draft chains. The newer contract candidate is **#215** (head 5963b51f46a9c7e55f76950cdc7abe900bed2d25) but its recorded main base is still 006a98c64a52d5bd6028ac5f9457acd31a72746a. **#223** stages Adzuna on that #215 branch. **#218** is an older work-opportunity surfaces chain based on contract head b28bc8d5b4f4075058e2a87b467b2ac1befbf68f; **#222** is another SEO chain based on integration/work-opportunity-surfaces-current-main-v2. Older #203/#204/#206 and #199/#200/#202 also remain open but are based on older commits. Do not combine these chains blindly: a human integration owner must choose one, reconcile its base with current main, and rerun exact-head Verify.
- The older Adzuna bridge #217 remains on contract head b28bc8d5b4f4075058e2a87b467b2ac1befbf68f and is not interchangeable with #223. All ingestion work remains staging-only; no feed activation, credentials or publication is implied.
- Live SEO responses for robots.txt and sitemap.xml were not revalidated in this execution. Do not claim a hosted fix without a timestamped check of the deployed responses after an approved release.

### Governance and unresolved blockers
- The repository ruleset “living World - protect main” (#24946178) currently reports enforcement disabled. A repository administrator must enable and verify the expected PR, review and required-check controls through the approved human process.
- Lovable’s Project Settings → Git destination is still unverified. The connected project history may sync commits to its selected branch; do not use Lovable edit/build mode until an administrator confirms the selected sync target is not main.
- No merge or deployment was performed. Production data, schema/RLS/grants, credentials, live source activation, and public AI activation remain human-gated.

## AI and global-scale direction

- First AI feature to design is a read-only, place-scoped “Ask this place” assistant over approved public records.
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.
- Grok design is a direction for this web app, not an automatic dependency on the external Grok product. A separately hosted Grok app would require a human architecture decision covering hosting, auth, API boundaries and ownership.

## Next actions

1. **Repository administrator:** verify and enable main branch protections / required PR reviews and checks; confirm the Lovable Project Settings → Git sync target is a non-main branch. Ruleset #24946178 currently reports enforcement disabled.
2. **Human design reviewer:** review #211 (Verify green on exact head b492c262d6ea73f0f2028300db96c41ee0) and manually inspect 375px/390px mobile, 768px tablet, 1280px/1440px desktop, keyboard/focus, screen reader, contrast, and sourced-photo states before deciding on approval/merge.
3. **Frontend reviewer:** review #220 (Verify green on exact head 6a50f7d3d390c7e3af33103accf65fc0f340febe) at viewport edges and on all required widths; check card-to-pin and pin-to-detail synchronization and unpinned records. It does not depend on #211.
4. **Frontend reviewer:** review #213 (Verify green on exact head a96a8f491db47328b886bfde97aff3704afdfe14) against the refreshed #211 parent and test Journey/Road Trip interactions. It stays draft until its parent is human-approved.
5. **Ingestion/reliability reviewer:** review #221, verify the source-health labels describe source connection health only, and manually check the internal reviewer-only /sources panel. No public “real-time” guarantees or new polling were added.
6. **AI/security owner:** continue Issue #209 only after server-side eligibility evidence, citations, prompt-injection tests, and approved rate/cost controls exist. “Ask about this place” on main is a disabled placeholder, not an active assistant.
7. **Design-source owner:** obtain the original Grok ZIP or accessible screenshots, record a verified manifest/checksum, and only then close the remaining screen-parity gaps.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
