# Grounded Matching — Phase 2 Integration Spine

**Status:** First pure foundation landed on `main` (2026-10-20)

## Purpose

Provide a single, honest ranking seam that the redesign (#177), locality pages, “I have 3 hours”, service search, and future Journey Engine can all call.

It ranks **only** verified `WorldEntry` records that are handed to it. It never fetches, invents, or creates a second discovery engine.

## Key invariants

- `findSupply()` remains the sole possibility/discovery authority.
- Quiet / sparse is a valid, useful state.
- Every match carries explicit evidence drawn from the record itself.
- Demonstration and expired records are excluded.
- Compatible with the existing `intents.ts` “Do something today” / “Why not?” layer.
- Ready to consume future `WorkOpportunity` and Needs once the #181–#190 bridges land.

## Public API

```ts
import { groundedMatch, queryFromIntent, threeHours } from "../lib/grounded-matching";

// Structured query
const outcome = groundedMatch(entries, {
  layers: ["work"],
  serviceCategory: "gardening",
  free: true,
  limit: 6,
});

// From an existing Intent
const q = queryFromIntent(intentById("work")!, { serviceCategory: "gardening" });

// “I have 3 hours”
const shortlist = threeHours(entries, { free: true, outdoors: true });
```

## Outcome shape

- `{ kind: "matches", matches: GroundedMatch[] }` — each match has `entry` + `evidence.reasons` + `evidence.strength`
- `{ kind: "quiet", message, suggestion }` — honest empty state that still invites contribution

## Next integration steps (do not do in this file)

1. Wire into locality / service pages and the redesign card surfaces **after** #177 visual foundation is reviewed.
2. Extend the input type once the reviewed `WorkOpportunity` contract is merged so jobs/odd-jobs appear in the same ranking.
3. Feed Needs (“Looking for a gardener in Newtown”) as a parallel signal when #184 lands.
4. Keep all ranking pure and fixture-tested; any AI scoring later must still only rearrange verified records.

## Human gates

- No live provider calls from this module.
- No change to indexability or publication rules.
- Visual language and map components remain owned by the redesign lane.
