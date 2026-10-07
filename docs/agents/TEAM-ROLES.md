# Team Roles (Specialist Contracts)

Roles are **capability contracts**, not model vendors. Any eligible provider (or human) may fulfil a role under policy.

Machine-readable source: `src/lib/agent-role-contract.ts` (`DEFAULT_ROLE_ROSTER`).

| Role ID | Owns (summary) | Must not |
|---------|----------------|----------|
| head_manager | Queue, routing, recovery, handoffs | Product truth, self-accept, merge |
| product_strategy | Objectives, acceptance criteria | Silent requirements, second matcher |
| architect | Boundaries, ADRs | Silent rewrites |
| engineering_* | Scoped implementation | Merge, self-accept, weaken tests |
| qa_verification | Independent evidence | Sole accept of implementer work |
| security_privacy | RLS, secrets, threat model | Weaken security for CI |
| research_intelligence | Evidence-backed research | Promote UNKNOWN → confirmed |
| seo | Topics, briefs, technical SEO | Ungated publish |
| marketing_growth | Experiments, messaging | Ungated spend/publish |
| design_ux | Flows, a11y, specs | Privacy-from-UI-alone |
| documentation_knowledge | Runbooks, ADRs index | Claim untested capabilities |
| devops_release | CI, deploy readiness | Ungated production change |
| analytics_learning | Measurement plans | Fabricate telemetry |
| agent_factory | New role templates | Grant prod privileges |

## Factory

`createRoleFromTemplate` + `registerRole` in `src/lib/agent-factory.ts`.
New specialists = config + tests. `canAcceptOwnWork` is always false.

## Related

- Product-domain lanes remain in `SPECIALIST-LANES.md` (capability/geo/trust).
- This file is the **company org chart**; SPECIALIST-LANES is the **product domain chart**. Both apply.
