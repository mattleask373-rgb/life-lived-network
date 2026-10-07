# Project Bootstrap

**Pattern:** copy the operating system → configure the project → start the team.

## Input (`ProjectBootstrapConfig`)

- project identity, objective, domain
- repositories
- tech stack, environments
- risk profile
- allowed providers
- enabled roles (optional subset)
- source-of-truth order
- budgets / extra human gates (optional)

## Output (`bootstrapProject`)

- role roster
- routing policy (`requireHumanFor`, independent reviewer preference)
- review policy (implementer cannot accept; human integrates)
- CI expectations
- onboarding checklist
- continuous loop names

## Example

See `LIFE_LIVED_BOOTSTRAP_EXAMPLE` in `src/lib/agent-project-bootstrap.ts`.

## New project checklist

1. Fill `ProjectBootstrapConfig`
2. Run/derive roster and policies
3. Wire Plane (or other control hub) work items to `agent-ready` tasks
4. Keep provider execute + production webhooks **off** until staging smoke
5. Smoke: claim → IN_PROGRESS → VERIFYING → REVIEW → independent ACCEPTED → human INTEGRATED
