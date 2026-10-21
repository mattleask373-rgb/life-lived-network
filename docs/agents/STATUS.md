# Agent System Status — 2026-10-21 (coordination cycle update)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` (latest observed 2026-10-21 ~16:08 UTC; merge of docs/grok-redesign-agent-handoff).
- Previous baseline `8d79247991187bf64813cf72e3ec75aeb508e2e9` is superseded.
- **Verified governance blocker:** ruleset [#24946178](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178), “living World - protect main”, reads `enforcement: disabled`. Its required checks include malformed `.github/workflows/verify.yml,`, stale `Verify`, and actual successful GitHub Actions context `verify` (integration id 15368). Repository admin must remove the first two, keep exact `verify`, confirm PR review/stale-review/last-push/thread-resolution/no-bypass rules, then enable enforcement. Connected tooling is read-only for rulesets; branch-protection GET returns 403. Lovable Project Settings → Git target remains UNKNOWN; require a human to confirm repo + non-main sync branch before write-mode edits.
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
- Root `.env` is no longer tracked on main (404 on contents).

## Live SEO probe (independent GET, 2026-10-21)

- Live `https://life-lived-network.lovable.app/robots.txt` returns platform-default Allow-only content (Googlebot/Bingbot/Twitterbot/facebookexternalhit/* Allow: /). Does **not** match repository `public/robots.txt` which Disallows private paths and names the sitemap.
- Live `https://life-lived-network.lovable.app/sitemap.xml` returns HTML 404 page ("Page not found").
- Repository static and dynamic routes are aligned with PRIVATE_PATHS; live publish/hosting has not reflected the latest assets. Human-approved republish + fresh GET verification remains a launch gate.

## Design direction and active integration queue — 21 October 2026

This snapshot reflects main at `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`. Many prior review candidates remain open drafts or dirty against current main; do not treat them as production baseline.

### Launch, security and autonomy gates
- Current main includes the home visual redesign, place-picker/search improvements, and a disabled “Ask about this place” placeholder. The Ask UI makes no model call. Grounded matching backs `doSomethingToday`; `findSupply()` remains the sole discovery authority.
- Issue #130 fixture bug appears corrected in source (`fixturesAllowed()` unconditionally false in production); issue remains open for maintainer reconciliation.
- #164 remains an open database default-ACL least-privilege finding; no grant/RLS change without a matrix and disposable-environment proof.
- #133 remains an open incident about a Lovable read-only request causing a direct main write to generated Supabase types. Lovable Project Settings → Git sync target remains unverified; do not send write-capable requests until non-main sync is confirmed. Prior ruleset audit reported main protection disabled; admin must verify/enable protection.
- Issue #121 and #116–#119 define a future durable 24/7 agent control plane. **No verified persistent executor heartbeat/always-on worker is evidenced.** Do not claim autonomous 24/7 operation.

## Next actions

1. Repository administrator: confirm Project Settings → Git repo + synced branch, switch to non-main if necessary, and verify enforced main protections/required checks.
2. Human reviewer: reconcile or close stale dirty PRs (#154 discovery, #156 auth tests, #120 env hygiene already largely done, etc.) against current main.
3. Product/release owners: diagnose and fix live robots.txt / sitemap.xml publish gap; re-probe after authorized deploy.
4. Keep Ask-this-place disabled until endpoint prerequisites pass.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
