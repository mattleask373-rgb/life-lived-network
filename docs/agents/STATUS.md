# Agent System Status — 2026-10-19 (Australia Phase One readiness audit)

## SOURCE OF TRUTH

Repository evidence on `main` @ `5f06fc336a748cf37c6a06ac272bee4a387bd745`, GitHub Actions, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active.

Full readiness report: `docs/release/AUSTRALIA-PHASE1-READINESS.md`

## CURRENT P0 QUEUE (Australia Phase One)

These are the only items that block a truthful pilot. All are human-gated.

1. **#157** — Remove tracked `.env`, add `.env.example`, harden ignore rules.  
   Status: open, non-draft, green Verify reported on prior heads. Mergeable currently blocked (reviews/protection).

2. **#163** — Require explicit service area for supply matches (remove residence-as-reach).  
   Status: open, green Verify on exact head `3fb33ac0…`. Core invariant fix.

3. **#154** — Exact open-need counts + fail-closed place scoping.  
   Status: open, green Verify reported.

4. **#169** — Runtime validation of need submissions + canonical place derivation.  
   Status: open, green Verify on head `d7006d4d…`. Touches same file as #154 — coordinate.

5. **#162** (draft) + **#161** — Conversation least-privilege grants, state-machine triggers, policy tests.  
   Status: open. Requires independent SQL review + disposable two-account verification before any migration is applied.

## SUPPORTING P1 (honest pilot UX / regression coverage)

- #156 private-route auth guards (tests)
- #129 private-route robots.txt alignment
- #165 production-fixture policy coverage
- #158 honest quiet-locality feedback
- #160 / #166 search context preservation
- #168 privacy-safe measurement contract
- #153 event-ingest query validation
- Issue #132 launch-QA / two-account matrix (still open)
- Issue #164 database-permissions

## PRODUCT / REAL-WORLD SURFACE (unchanged principles)

- **Canonical supply engine:** REAL and live on main. `src/lib/supply-engine.ts` — sole possibility/discovery authority. Do not create a second matcher.
- **Geography:** Country-agnostic hierarchy in `src/lib/places.ts`. Default slug `uk-and-ireland`. Australia (or any new market) is data, not code branching.
- **Invariants:** LIVING IN PLACE ≠ SERVING PLACE remains violated on main until #163 lands. All other hard invariants in `docs/agents/INVARIANTS.md` still apply.
- **No fabrication:** Fixtures must not leak; unknown must not become confirmed; quiet preferred over invented activity.

## CI / DRIFT NOTES

- Verify workflow (install / lint / test / build) is the gate.
- Several key PRs report green Verify on their exact heads.
- `mergeable_state: blocked` observed on P0 PRs — almost certainly required reviews or branch protection. Human action required.
- Older control-plane / agent-orchestration PRs remain out of scope for Australia Phase One and stay human-gated.

## NEXT ACTIONS (ordered)

1. Founder / reviewer: prioritise independent review of #157 and #163.
2. Coordinate merge of #154 and #169 (shared surface).
3. Complete SQL + disposable-DB proof for #162 before any migration consideration.
4. Verify (or load) genuine Australian place hierarchy via approved aggregate checks only.
5. Close or explicitly waive remaining #132 matrix items.
6. No claim of launch readiness until the definition of done in the readiness report is met.

## SAFETY

No autonomous merge to main. No force-push. No production schema/RLS/secret changes without separate explicit founder approval. External collaborators (including this Grok session) work only via reviewable PRs on `agent/grok/*` branches.
