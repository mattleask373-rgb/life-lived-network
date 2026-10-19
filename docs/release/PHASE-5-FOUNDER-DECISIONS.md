# Phase 5 Founder Decisions
**Date:** 2026-10-19  
**Current main:** `5f06fc336a748cf37c6a06ac272bee4a387bd745`

Copy-paste these messages into the relevant PR or into issue #125.

---

### 1. Merge #157 (env hygiene)
```
Founder decision — PR #157
Exact-head Verify is green. Independent review complete.
Approve and merge #157?
(Recommended: Yes. Raise history-scan as a separate follow-up.)
```

### 2. Merge #163 (service-area only)
```
Founder decision — PR #163
Restores the core invariant: residence ≠ service area.
Exact-head Verify green. Independent review complete.
Approve and merge #163 after #157?
(Recommended: Yes.)
```

### 3. Merge #170 (configurable default locality)
```
Founder decision — PR #170
Makes default locality configurable without inventing places.
Exact-head Verify green. Independent review complete.
Approve and merge #170 after #163?
(Recommended: Yes.)
```

### 4. Merge #154 then #169
```
Founder decision — PRs #154 + #169
#154: exact counts + fail-closed scope
#169: strict need validation + canonical place
Both green. Sequential merge recommended (#154 first).
Approve sequential merge?
```

### 5. #162 Conversation security scope
```
Founder decision — PR #162
Disposable-database proof has NOT been executed.
Choose one:
A. Authorise disposable-DB test run, then re-evaluate
B. Explicitly exclude conversation-hardening from Friday beta claims
(Recommended: B for limited beta honesty.)
```

### 6. Australian data
```
Founder decision — Australian locality data
No Australian records found in repository. Live DB status UNKNOWN.
Choose one:
A. Confirm existing production records (aggregate evidence)
B. Approve labelled import plan from approved source
C. Keep Australia out of Friday beta scope
(Recommended: C.)
```

### 7. Listing-linked conversations
```
Founder product decision
Should users be able to start conversations from listings that are not linked to a need?
Yes / No / Defer
(Recommended: Defer until after limited beta.)
```

### 8. Live Ticketmaster events for beta
```
Founder decision
Are live Ticketmaster (or other external) events required for the limited beta?
Yes / No
(Recommended: No — keep scope minimal.)
```
