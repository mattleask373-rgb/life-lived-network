# Intelligence Cycle — Integration Boundary

Status: **PROOF SLICE BUILT / PRODUCTION EXECUTION NOT ACTIVATED**

## What now exists

`src/lib/intelligence-cycle-runner.ts` is a pure provider-neutral cycle kernel.

It implements:
1. deterministic candidate selection
2. scope/authority validation
3. capability gating
4. provider-attempt evidence binding
5. independent verification
6. epistemic anti-inflation
7. lease-generation/actor/run/attempt fencing
8. machine-readable cycle traces
9. explicit blocked outcomes

The companion test file exercises these invariants.

## Mapping to the existing orchestration contracts

The runner intentionally stays structurally typed until the provider-neutral orchestration contracts are available on the integration branch.

The exact contracts inspected in PR #61 are:
- `AgentTaskEnvelope` from `src/lib/agent-orchestration.ts`
- `AgentExecutionResult` / `validateExecutionResult` from `src/lib/agent-execution-contract.ts`
- `ProviderDescriptor` / `isEligibleProvider` from `src/lib/agent-provider.ts`
- `FineCapabilityId` / permission envelopes from `src/lib/agent-capability-registry.ts`
- claim/lease policy from `src/lib/agent-lease-policy.ts`

### Required composition

`CycleTask.requiredCapability` → provider capability eligibility
`AuthorityContext` → authenticated actor + run + project/tenant scope + current lease generation/token + attempt
provider execution result → evidence only
independent review → separate authority boundary
reality delta → learning input, never automatic certainty escalation

## Important current limitation

The mission branch does not contain PR #61's implementation files, so the runner does **not** import them yet. This is deliberate rather than speculative: importing absent contracts would manufacture an integration dependency.

When the control-plane implementation is available on the integration branch, the smallest next adapter should be structural and one-way:

`AgentTaskEnvelope → CycleTask`
`ProviderDescriptor → capability policy`
`AgentExecutionResult → Evidence`
`verified result → Reality Delta input`

No second queue, matcher, persistence layer, provider registry, or execution authority should be introduced.

## Trust rule

The runner can plan and validate a cycle. It does not grant authority.

A valid cycle still requires the durable control plane to establish:

`authenticated identity → scoped task → current lease generation/token → attempt → evidence → independent verification → state transition`

GitHub Actions may provide wake-up/orchestration and concurrency controls, but the durable control plane remains authoritative.

## Next build target

After the control-plane contract is available:
1. replace structural adapter fields with exact repository types
2. add a pure adapter test matrix
3. connect execution-result validation
4. connect provider capability routing
5. bind cycle attempt identity to durable lease fencing
6. persist the cycle trace as evidence
7. prove restart/reclaim behaviour
8. only then evaluate a bounded staging runner

No autonomous merge/deploy, credential escalation, RLS weakening, or human-gate removal is part of this integration.