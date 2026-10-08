# Fleet multi-agent process OS

**Status: IMPLEMENTED (contracts) / NOT LIVE**

## Actors

| Actor | Bias | Must not |
|-------|------|----------|
| **Grok** | Control-plane fencing, recovery, identity, long multi-file loops, security | Merge, deploy, invent tenants |
| **ChatGPT** | Product APIs, SEO/growth, durable SQL lineage, adversarial review, stream kits | Self-approve, publish paid/official |
| **Lovable** | UI surfaces, map/locality UX, cloud wiring drafts, visual polish | Invent data authority, weaken RLS, hold secrets in client |
| **Human** | Merge, deploy, credentials, paid spend, production LIVE activation | — |

## Loop

```
RECONCILE → routeWork(class) → primary builds → collaborators challenge
→ tests → handoff packet → draft PR → RECONCILE
```

If human-gated: queue attention → switch work class → continue.

## Lovable maximisation rules

1. Lovable owns **surface** speed: routes, components, layout, map chrome.
2. Domain truth stays in `src/lib/*` canonical modules (supply, locality, SEO helpers).
3. Lovable must consume public APIs / server functions — not embed service-role keys.
4. When Lovable needs env/cloud: handoff `lovable_cloud_wiring` → **human gate**.
5. Demonstration data never becomes indexable SEO.

## Handoff packet

Use `createHandoffPacket` / `formatHandoffMarkdown` so Grok ↔ ChatGPT ↔ Lovable
share state vocabulary (DESIGN…LIVE) without collapsing states.

## Related pure modules

- `fleet-agent-lanes.ts` — routing
- `fleet-handoff-packet.ts` — continuity
- `fleet-stream-kit.ts` — multi-income stream scaffolds
- `agent-run-bootstrap.ts` — authenticated run policy
