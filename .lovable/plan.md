# Agent Operations cockpit

## Goal
Add a calm, internal operations area where a human can understand the agent queue, ownership, evidence, failures, review gates, and required decisions without implying that simulated work is live.

## Build
- Add a private `/agent-operations` route and a discreet account-area link.
- Model the existing task lifecycle, specialist lanes, providers, evidence, handoffs, approvals, and event timeline in one adapter-ready UI module.
- Read live `agent_tasks` / `agent_events` only when those tables and an authorised integration are available; for now render an unmistakably labelled simulated dataset and a “No live execution connected” state.
- Build responsive queue, lane/provider overview, health timeline, approval gate, loading/error/empty states, and an accessible task-detail drawer using existing tokens and controls.
- Preserve all control-plane invariants: unknown stays unknown, no autonomous merge, independent review, and no fabricated execution claims.
- Add focused tests for status semantics and fix the existing unrelated TypeScript indexing error so the project returns to a working state.

## Technical details
- Keep operational fixtures isolated from product fixtures and export typed adapter contracts for future durable ledger connection.
- Use the established private metadata helper and TanStack route conventions.
- Record the new internal-operations module boundary in `AGENTS.md` and track this sprint in `roadmap.md`.
- Verify with focused tests, the automated build signal, and desktop/mobile browser checks.
