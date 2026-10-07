# Project Isolation

Each project configuration is an isolated OS instance.

## Rules

1. **projectId** scopes tasks, opportunities, memory, and attention items.
2. Repositories listed in bootstrap define the write/read boundary.
3. Credentials and secrets are never shared across projects in config.
4. Candidate work and opportunities always carry `projectId`.
5. Bootstrapping Project B must not mutate Life Lived roster or queue state.

## Enforcement today

- Pure TypeScript contracts require `projectId` on opportunities, candidates, memory, attention.
- `bootstrapProject` returns a new object; no global mutable registry.

## NOT VERIFIED

- Live multi-tenant DB row-level isolation for agent tables (single-project proving ground today).
- Cross-project credential vault separation.

## Human gate

Adding real multi-project production tenancy requires human architecture approval.
