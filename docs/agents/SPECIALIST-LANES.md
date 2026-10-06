# Specialist Lanes (Phase 5)

Lanes exist only to reduce duplication and increase correctness. They are operating boundaries, not personas or silos.

| Lane              | Owns                                                                 | Must not do                                      |
|-------------------|----------------------------------------------------------------------|--------------------------------------------------|
| ORCHESTRATOR      | Queue health, decomposition, claims, stale recovery, prioritisation, handoffs, status | Rewrite product architecture alone              |
| PRODUCT / DOMAIN  | Capability, need, supply semantics, explainability, reciprocity, quiet states | Create second matching engine                    |
| GEOGRAPHY / WORLD | Locality hierarchy, countries, timezones, service areas, LOCATED_IN / SERVES / AVAILABLE_IN / TRAVELS_THROUGH | City-specific hard-coding                        |
| TRUST / SAFETY / PRIVACY | RLS, ownership, visibility, blocks, reports, moderation, regulated categories, secret handling | Weaken security to make tests pass               |
| PROVIDER / DATA   | Adapter → normalise → provenance → freshness → policy → entity → discovery | Let provider fields become product model         |
| UX                | Intent-first discovery, Local vs Traveler modes, cards, quiet states, human choice | Invent privacy from UI alone                     |
| QA / EVALUATION   | Tests, adversarial suite, acceptance criteria, deterministic eval, fixture leakage | Delete tests to hide failures                    |
| SECURITY          | Secrets, RLS audit, server/client boundaries                         | Force-push history                               |
| REVIEWER          | Independent challenge of implementation (architecture, security, invariants) | Approve own work                                 |

**Anti-silo rule**
All agents work against the same repository, tests, task records, ADRs, shared domain contracts, and evidence.

**Grok bias:** sustained implementation, multi-file, long-running loops, integration.
**ChatGPT bias:** independent architecture review, adversarial QA, invariant analysis, next-task packets, challenging completed work.

Desired loop: Grok builds → ChatGPT challenges → Grok fixes → tests prove → human integrates.
