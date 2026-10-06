# AI Worker Watchdog

The watchdog is observational and escalatory.

Detect:
- stale IN_PROGRESS tasks
- failed CI
- PRs lacking evidence
- merge conflicts
- semantic conflicts
- repeated failures
- blocked human gates
- duplicate/competing abstractions
- tasks exceeding declared scope

Allowed:
- comment
- label
- create diagnosis/task issue
- request clarification
- report status

Forbidden:
- production merge
- bypass CI
- weaken RLS/security
- expose secrets
- rewrite protected history
- invent product semantics
