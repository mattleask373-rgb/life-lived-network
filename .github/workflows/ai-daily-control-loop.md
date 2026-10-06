---
on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

safe-outputs:
  create-issue:
  add-comment:

---

# Living World — Daily AI Engineering Control Loop

Review the repository's AI worker issues, open pull requests, CI evidence, dependencies and recent commits.

Apply the worker roster and task contract in `docs/ai-worker-roster.md` and `docs/ai-worker-task-contract.md`.

Perform:
1. RECON — identify current state and unfinished work.
2. TRIAGE — classify REAL/PARTIAL/PROPOSED/MISSING/CONFLICTING/UNKNOWN.
3. DECOMPOSE — identify only bounded tasks.
4. ASSIGN — identify the designated worker.
5. MONITOR — detect stale tasks, failed CI and conflicts.
6. EVALUATE — check evidence and acceptance criteria.
7. RECONCILE — prevent duplicate matchers, duplicate providers and semantic conflicts.
8. PREPARE REVIEW — create concise task/diagnosis issues or comments.

Do not merge production changes. Do not modify code in this watchdog workflow. Do not invent evidence. If a task requires human approval, mark it HUMAN_GATE and explain why.

Return a concise report with CURRENT STATE, COMPLETED, IN PROGRESS, BLOCKED, CONFLICTS, PARALLEL OPPORTUNITIES, REVIEW FINDINGS, HUMAN GATES and NEXT THREE TASKS.
