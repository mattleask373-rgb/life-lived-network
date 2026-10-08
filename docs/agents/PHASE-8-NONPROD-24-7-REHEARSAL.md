# Phase 8 — Non-production 24/7 Rehearsal

**Status: IMPLEMENTED / NOT LIVE / PRODUCTION EXECUTOR OFF**

## Purpose

Exercise the control-plane decision surface continuously in **DRY_RUN** or
**SHADOW** mode without activating a production executor.

## What this is

A pure rehearsal loop (`runRehearsalCycle`) that:

1. Runs recovery decisions (`MARK_STALE` / `HOLD`)
2. Evaluates reclaim gates (only from authoritative `STALE`)
3. Runs supervisor selection (`DISPATCH` / `HOLD`)
4. Optionally invokes an injected shadow provider (SHADOW mode only)
5. Emits a `RehearsalReport` with `productionLive: false` always

## What this is not

- Not a live 24/7 production executor
- Does not claim leases in durable storage
- Does not write production rows
- Does not call real providers unless explicitly injected in SHADOW
- Does not merge, deploy, or mint credentials
- Does not promote attempts to DONE / ACCEPTED / INTEGRATED
- Does not consume human approvals
- Does not weaken RLS or human gates
- **LIVE mode is rejected at the API boundary**

## Path to real continuous operation (still gated)

| Phase | Requirement |
|-------|-------------|
| 3–4 | CI green + recovery/dispatch kernels proven |
| 5 | Evidence-first verification wired |
| 6 | Human attention queue |
| 7 | Continuous GitHub engineering loop (still non-prod) |
| 8 | This rehearsal (current) |
| 9 | Hosted Supabase verification + RLS proof |
| 10 | Human-reviewed activation (explicit opt-in only) |

Until Phase 9–10 proof and human review complete, the executor remains **NOT LIVE**.

## Lineage

Stacked on Phase 3 supervisor + recovery. Related: #97, #98, #102, #103.
