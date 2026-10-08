# Ready to run — non-production first

**Status: NON-PROD REHEARSAL READY / PRODUCTION NOT LIVE**

## What “ready to run” means right now

| Capability | State |
|------------|--------|
| Pure supervisor reconcile | IMPLEMENTED |
| Pure recovery + reclaim gate | IMPLEMENTED |
| Provider runtime boundary | IMPLEMENTED |
| Attempt completion fencing | IMPLEMENTED (pure) |
| Dry-run rehearsal entry | IMPLEMENTED |
| CI green on stack | NOT PROVEN (registry/lockfile failures) |
| Hosted Supabase + RLS | HOSTED PROOF PENDING |
| Production 24/7 executor | **NOT LIVE** |

## Run the non-prod rehearsal locally

```bash
# from repo root on branch ready-nonprod-runner (or stacked control-plane branch)
bun install   # may fail if @lovable.dev registry is down — CI has same issue
bun run scripts/rehearsal-dry-run.ts
```

Expected:
- JSON `RehearsalReport` with `productionLive: false`
- Recovery / reclaim / reconcile / attempt-fence steps
- Stderr: `OK — productionLive=false; no durable writes; LIVE not activated`
- Exit 0

This path **does not**:
- claim leases in durable storage
- call real providers
- write production rows
- merge or deploy
- mint credentials

## Human activation checklist (Phases 9–10)

Do **not** skip. Production LIVE requires explicit human review.

### Phase 9 — Hosted verification
- [ ] Control-plane migrations applied on hosted Supabase
- [ ] RLS proven: anon/authenticated cannot read/write agent execution tables
- [ ] SECURITY DEFINER functions: search_path fixed; grants reviewed
- [ ] `dispatch_agent_attempt` race-tested under concurrent clients
- [ ] Attempt completion RPC enforces generation + token fence
- [ ] CI green on the integration SHA (not only unit tests)

### Phase 10 — Human-reviewed activation
- [ ] Independent security review of identity, scope, lease, attempt fencing
- [ ] Explicit written decision to enable non-prod continuous runner only
- [ ] Explicit written decision (separate) if production executor is ever enabled
- [ ] Kill switch / suspend path documented and tested
- [ ] Human attention queue for P0/P1 risk and merge/deploy boundaries
- [ ] No provider path can set DONE / ACCEPTED / INTEGRATED

Until every box above is checked by a human, the system remains:

**IMPLEMENTED / NOT LIVE**

## Related

PRs/branches: #102, #103, harden-attempt-completion-fencing, phase8-nonprod-24-7-rehearsal, ready-nonprod-runner
Issues: #97, #98
