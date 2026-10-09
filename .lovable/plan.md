# Real World Atlas: programme plan (planning only)

## 1. Executive summary
The product is honest by design. It has one discovery engine, separate bands for "can do", "is willing" and "is available", visible trust labels and consent-based connections. The world is still mostly empty, though: the only things visible are demonstration items in the preview.

**Correction to the earlier proposal:** the "Who provides this / How to enquire" block already exists. It is in `src/components/entry-sheet.tsx` (lines 131–173) and uses the helpers `providerLine`, `qualificationLine` and `nextStepFor` from `src/lib/services.ts`. So it is no longer a new build. The task is to check it against the trust rules.

**Most important conclusion:** settle the source of truth first, then the security evidence, before any commercial work:
- which repo is canonical
- which backend option (A/B/C)
- the exposed-schema check

At the same time, the business pilot can be researched without building anything.

## 2. Verified baseline (this session, read-only)
| Fact | Evidence |
|---|---|
| Lovable-managed git remotes only; neither is a GitHub URL | `git remote -v` |
| "life-lived-network2" not present | `rg` over the repo |
| Backend bound via env names `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` (plus their `VITE_` forms); values not shown | `.env` (names only), `supabase/config.toml` |
| 30 migration files; app tables get `GRANT ALL ... TO service_role` | `supabase/migrations/*` (e.g. `20260919103935_*.sql:10`) |
| Policies reference `private.people_are_blocked` | 3 migrations, incl. `20260919104038_*.sql` |
| One engine: `findSupply` (612 lines), wrappers `whatElse` and `whoCouldMakeThisHappen`; 8 ordered bands, each with its own caveat text | `src/lib/supply-engine.ts:55-89, 197` |
| ADR 001 forbids a second engine; ADR 003 number used twice | `docs/adr/` |
| CI: `bun install --frozen-lockfile`, `bun run lint`, `bun run test`, `bun run build` | `.github/workflows/verify.yml` |
| 28 test files on disk (count only, not run) | file listing |
| No product analytics in the app code | `rg` search |
| Business fields already in listings: organisation, provider_note, qualification_note, booking_state, booking_url, service_category | DB schema plus `src/lib/services.ts` |
| Roles via `has_role` and `is_safety_reviewer`; both are tied to `auth.uid()` | DB functions |
| Private bucket `profile-photos` | storage listing |

## 3. Unknowns and owner decisions
1. **Canonical GitHub repo:** `life-lived-network` or `life-lived-network2`? Freeze or archive the other one? This is BLOCKED for me; only the owner can confirm, via + > GitHub.
2. **Backend option A, B or C:** still open. The safe default is A (keep the current one), with no migration.
3. **Duplicate ADR 003:** renumber or not? The default is to leave both untouched and just note it.
4. **Exposed schemas:** whether `private`, realtime or extensions are reachable from outside is NOT_VERIFIED. It needs a read-only settings check.
5. **The earlier audit leads** (extra grants, broad default privileges for future objects, the helper's EXECUTE grant): NOT re-confirmed this session.
6. **Pilot pricing (£250–£750):** an unvalidated hypothesis.

## 4. Product and architecture map
```text
Routes ─► components ─► src/lib/*.functions.ts (server fns) ─► Supabase (RLS)
  /, /$country/$place ─► whats-here, living-map, entry-card(TrustChip), entry-sheet
  /need, /need/$id ─► needs.functions ─► findSupply() ─► connection.functions
  /conversations ─► connection_requests / connection_messages (+ user_blocks)
  /make, /give, /help, /earn ─► listings, hour_offers, needs
  /profile ─► person_capabilities, availability_windows, service_areas
  /sources ─► sources/source_records (ingest, provenance)
  /moderation ─► content_reports (is_safety_reviewer)
  api/public/sitemap* ─► public places/listings only (needs leak test)
```
- **Trust model:** a listing's trust state comes only from its stored quality and where it came from (`src/lib/trust.ts`). Results from people say that the information was stated by that person.

## 5. Risk register
- **Confirmed (code):**
  - Service-role grants are broad; that is normal for the service role.
  - There are no product metrics, so there is no baseline for any outcome.
  - The existing service block shows availability as the provider's own free-text `when` value and does not label it "Stated by provider". This needs review.
  - The ADR numbering clash.
- **Conditional:**
  - If `private` or realtime is exposed, the blocked-people helper or message changes might be reachable from outside.
  - If the sitemap reads tables without the same filters the app uses, private or reported items might be listed.
- **Suspected:** extra TRUNCATE/REFERENCES/TRIGGER grants to `anon` and `authenticated`, and broad default privileges (from the earlier audit).
- **Unverified:**
  - whether RLS behaves correctly end to end
  - backup and restore status
  - whether the two repositories have drifted apart

## 6. 30-day programme
- **Week 1, baseline:**
  - owner decisions on the repo, backend and ADR
  - a read-only database catalogue check of grants, policies and exposed schemas
  - the risk register re-confirmed
  - Gate: a decision log is signed.
- **Week 2, trust hardening:**
  - review of the service block
  - leak tests for the sitemap and metadata
  - Gate: CI green and human review.
- **Week 2–3, pilot research (no build):**
  - one place and one segment
  - at least 20 pain signals from at least 3 source types
  - 5–10 legitimate buyer conversations
  - Gate: problem statement plus go/no-go.
- **Week 4:** decide whether to run a paid manual pilot. Draft a security remediation migration only if it is approved separately.

## 7. First three implementation candidates (not started)
1. **Service block trust check:**
   - Label provider fields "Stated by provider".
   - Use "Not stated" for empty fields.
   - Keep availability text from implying it is confirmed.
   - Add tests for `providerLine`, `qualificationLine` and `nextStepFor`.
   - Impact high, confidence high, effort small, risk low.
2. **Sitemap and public metadata leak test:** prove that private, blocked, reported, demonstration and expired items never appear. Impact high, effort small.
3. **A consent and limits note on the enquiry step:** what happens when someone sends a connection request, and that nothing is shared without consent. Impact medium, effort small.

## 8. Local-business pilot
- **Scope:** one town and one segment, for example trades or wellbeing (regulated categories are excluded at first).
- **Research:** collect public pain signals with dates, links and limitations. Never scrape personal contacts or send bulk emails.
- **Offer:** a fixed-scope review of the business's online presence and its enquiry journey, with a list of prioritised fixes. No promises about rankings or leads.
- **Measure:** hours spent, costs, results, willingness to pay, objections, repeat demand and margin.
- **Go/no-go:** at least 3 of 10 conversations show willingness to pay, the margin is positive at the tested price, and nobody is put off by trust concerns.
- **Blocker:** reaching buyers lawfully depends on the owner.

## 9. AI software factory (design only)
- **Workflow:** issue → context (`AGENTS.md`, invariants, ADRs) → plan → isolated branch → small diff → CI → AI review of the diff → human approval → human merge → measure the outcome.
- **Each task records:**
  - inputs and outputs
  - allowed repo paths
  - no production database credentials
  - runtime cap and at most 3 retries
  - a cost ceiling
  - an audit event
  - a fallback: stop and diagnose
- **Uses only what already exists:** Lovable, GitHub PRs, `verify.yml`, and the control-plane docs in `docs/agents`. No new tools.
- **Durable task tables** stay in the separate backend plan, after the A/B/C decision.

## 10. Security and database roadmap
1. Read-only checks: grants per role, default privileges, exposed schemas, storage policies and the security-definer functions.
2. Classify each finding as a practical exposure or only a theoretical privilege.
3. A non-destructive migration to revoke anything unnecessary from anon and authenticated, written with a rollback, behind an approval gate.
4. RLS tests with two users and a blocked pair.

There will be no grant changes to "fix" the helper, and no backend move until A/B/C is decided.

## 11. Test strategy
- **Commands:** `bun run lint`, `bun run test`, `bun run build`.
- **Gaps:**
  - tests for the services helpers
  - sitemap leak tests
  - RLS behaviour tests
  - a test that `findSupply` ordering stays unchanged for the regulated-category fixtures

## 12. Issue and PR breakdown (in dependency order)
1. DECISION: canonical repo. Acceptance: owner confirms it in writing.
2. AUDIT: read-only database grants and exposure report. Acceptance: every finding classified.
3. PR: service block trust labels plus tests. Acceptance: the criteria in section 7, and CI green.
4. PR: sitemap leak tests. Acceptance: failing fixtures prove that private and demonstration items are excluded.
5. RESEARCH: pilot evidence log. Acceptance: at least 20 signals and a go/no-go memo.
6. PR (gated): remediation migration with rollback.

## 13. Metrics and learning loop
There is no baseline yet. The first metrics would be:
- the useful-result rate from `findSupply`, as a count of quiet answers versus answers with results
- how many enquiries are started and completed
- how many service listings have empty fields

All of these are aggregate only, with no message content, behind a separate approval. After each slice, record the hypothesis, the result, the cost and a decision to continue, change, pause or stop.

## 14. Human decision checklist
| Decision | Safe default | Work that can continue meanwhile |
|---|---|---|
| Canonical repo | Treat Lovable as the working copy and make no repo changes | Read-only audits |
| Backend A/B/C | A, no migration | Front-end trust slices |
| ADR 003 duplicate | Leave both | Everything |
| Exposed schemas | Assume risk; change nothing | Write the tests |
| Pilot buyer access | Research only | Evidence log |

## 15. Status
- Files changed: only this plan.
- Packages: none.
- Schema and data: unchanged.
- Tests: not run.
- Deployment: none.

**The most valuable next step:** the owner confirms the canonical repository. Every later PR, CI result and agent task depends on knowing which repository is real, and building first risks doing the work twice in repositories that drift apart.
