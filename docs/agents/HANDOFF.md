# Required Handoff Format

Every substantive task must leave a durable handoff. “Done” is not a handoff.

```
TASK: <task_id>
OWNER: <id>
STATUS: <lifecycle state>
SCOPE:
  in: [...]
  out: [...]

OBJECTIVE:

WHAT I VERIFIED:
- ...

WHAT I CHANGED:
- paths:
- behaviour:

DECISIONS:
- decision: ...
  reason: ...
  alternatives rejected: ...

FILES TOUCHED:
- ...

TESTS RUN:
- command
- result (pass/fail + summary)
- never claim a test was run if it was not

RESULTS:

KNOWN RISKS:
- known:
- unknown:

BLOCKERS:
- exact blocker:
- evidence:
- what is required:
- owner of next action:

NEXT SAFE STEP:
- smallest concrete action

REVIEW REQUEST:
- specific questions for independent reviewer

DO NOT REPEAT:
- completed work
- rejected approaches
```

Independent review must actively challenge architecture, correctness, regression, security, geography, trust, matching semantics, performance, testing, and product truthfulness.
A green test suite is necessary but not sufficient.
