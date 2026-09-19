# Complete the Road Trip demo — Slices 4 and 5

## Outcome
Extend the existing road-trip page without changing its map or corridor behavior. Results will show clearer, fact-backed evidence, and people can build, reorder, remove, recalculate, and locally retain a stop sequence.

## Build
1. **Richer evidence**
   - Extend each deterministic discovery result with all matching interests, its existing route classification, concise route/date evidence, and only supported provenance/freshness labels.
   - Keep straight-line proximity explicitly separate from unavailable driving detours.
   - Present this in a compact road-trip result designed for scanning, while retaining the existing detail sheet.

2. **Journey builder**
   - Add an “Add to journey” action with duplicate prevention and immediate added state.
   - Add a visible journey panel showing origin, ordered stops, and destination.
   - Provide accessible move-up, move-down, and remove controls.
   - Add a recalculation action that reruns existing corridor discovery without changing stop order or implying route optimisation.

3. **Persistence and future compatibility**
   - Store the current road-trip draft in the browser using a small versioned structure with origin/destination, mode/date/interests, and ordered canonical entry IDs.
   - Keep sharing and lift coordination out of this structure; the existing persisted journey contexts remain the future server-side path for explicit sharing and opt-in.

4. **Verification**
   - Add pure tests for interest evidence, provenance/freshness labels, duplicate prevention, ordering, removal, and persistence-safe restoration.
   - Run focused tests and verify the full desktop and mobile road-trip flow in the live preview.

## Explicitly deferred
No routing provider, driving distance/time, precise detours, public transport, Ticketmaster integration, route optimisation, or lift sharing.
