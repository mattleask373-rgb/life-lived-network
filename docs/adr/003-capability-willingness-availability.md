# ADR 003: Capability ≠ Willingness ≠ Availability (and related distinctions)

**Status:** Accepted  
**Date:** 2026-10-06

## Decision
The following distinctions are permanent product invariants and must be enforced by the supply engine, domain logic, and discovery UI:

- Capability ≠ Willingness
- Capability ≠ Availability
- Journey ≠ Availability (and ≠ live location, ≠ permission to contact)
- Living in / located in a place ≠ serving that place
- Selecting / ticking a place ≠ travelling through it
- Skill ≠ Role ≠ Qualification
- Unknown must never be rendered as confirmed / yes

Regulated categories require hard qualification constraints where policy demands them; “has relevant skill” must never become “safe/qualified to perform regulated work.”

## Consequences
- Supply bands and caveats must preserve these distinctions.
- Tests must cover the negative cases (journey mistaken for availability, etc.).
- Any future feature that collapses these distinctions requires a new ADR and human approval.
