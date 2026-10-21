/**
 * "Ask this place" — availability contract for a future grounded assistant.
 *
 * There is no grounded assistant endpoint yet (see
 * docs/ai/GROUNDED-ASSISTANT-AND-GLOBAL-INTEGRATION.md, section B). Until every
 * gate below is satisfied server-side, the UI must report "unavailable" and
 * must never produce an answer. This module holds no model call and no data.
 */

export const ASK_PLACE_GATES = [
  "Server receives only records already returned by findSupply() and proven publishable",
  "Every answer sentence cites a record id, source and freshness",
  "Signed-in access, per-person rate limit and cost cap approved (issue #209)",
  "Empty result answers 'No verified results' and adds nothing",
] as const;

export type AskPlaceState =
  | { status: "unavailable"; reason: string; gates: readonly string[] };

/** Always unavailable until a reviewed server contract exists. */
export function askPlaceState(): AskPlaceState {
  return {
    status: "unavailable",
    reason: "Not available yet. Asking questions about this place needs checks that aren't finished.",
    gates: ASK_PLACE_GATES,
  };
}
