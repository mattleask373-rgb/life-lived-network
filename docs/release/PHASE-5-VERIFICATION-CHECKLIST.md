# Phase 5 Verification Checklist
**Use before any go/no-go decision**

## Pre-merge (per PR)
- [ ] Exact current head SHA recorded
- [ ] Base is current main
- [ ] Exact-head Verify (install / lint / test / build) is green
- [ ] Independent review comment present
- [ ] No unresolved review threads
- [ ] Changed files reviewed for scope creep

## Post-merge (after each of #157, #163, #170, #154, #169)
- [ ] New main SHA recorded
- [ ] Verify workflow green on the new main SHA
- [ ] Smoke-test the affected path (env load, service-area matching, counts, need creation)

## Security
- [ ] #162 either proven on disposable DB or explicitly excluded from claims
- [ ] No production migration applied without disposable proof + founder approval
- [ ] Tracked .env removed from tree; history-scan decision recorded

## Data
- [ ] Supported localities explicitly known
- [ ] Australia remains out of scope unless inventory + rights evidence provided
- [ ] No synthetic places or fabricated supply

## Production / SEO
- [ ] Authorised publish/sync completed
- [ ] Live `/robots.txt` checked and private routes disallowed
- [ ] Sitemap endpoint returns expected result
- [ ] Evidence timestamped in issue #125

## Limited-beta acceptance
- [ ] Core journeys work on already-supported localities
- [ ] Honest empty / quiet states visible
- [ ] Private routes deny unauthenticated and unauthorised access (source + any available E2E)
- [ ] Unsupported features clearly disclosed
- [ ] No critical security blocker remains unaddressed or undisclosed
