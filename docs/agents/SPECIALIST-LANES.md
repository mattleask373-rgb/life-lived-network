# Specialist Lanes (Fleet process)

Lanes reduce duplication. They are operating boundaries, not personas.

| Lane | Owns | Must not do |
|------|------|-------------|
| ORCHESTRATOR | Queue health, prioritisation, handoffs, status | Rewrite product architecture alone |
| CONTROL_PLANE | Leases, fencing, recovery, runs/attempts, rehearsal | Grant production LIVE |
| PRODUCT / DOMAIN | Capability, need, supply semantics, APIs | Create second matching engine |
| GEOGRAPHY / WORLD | Locality hierarchy, service areas | City-specific hard-coding |
| TRUST / SAFETY / PRIVACY | RLS, ownership, moderation, secrets | Weaken security to pass tests |
| PROVIDER / DATA | Adapter → normalise → provenance → discovery | Provider fields as product model |
| UX | Intent-first discovery, quiet states | Invent privacy from UI alone |
| SEO / GROWTH | Meta, sitemaps, drafts, experiments | Fabricate rankings/revenue; auto-publish |
| QA / EVALUATION | Tests, adversarial suite, acceptance | Delete tests to hide failures |
| SECURITY | Secrets, RLS audit, server/client boundaries | Force-push history |
| REVIEWER | Independent challenge | Approve own work |
| **LOVABLE_SURFACE** | UI routes, visual polish, map chrome, cloud wiring *drafts* | Service-role in browser; invent inventory |
| HUMAN | Merge, deploy, credentials, paid spend, LIVE activation | — |

## Preferred loop

**Grok builds control plane → ChatGPT challenges + product/SEO → Lovable surfaces UI → Grok/ChatGPT fix → tests prove → human integrates.**

## Anti-silo

Same repository, tests, task records, evidence, and state vocabulary for all agents.
