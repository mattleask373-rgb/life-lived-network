/**
 * What an empty discovery list should say. A filter that hides everything is
 * not the same as a place with nothing recorded, and must not claim it is.
 */
export type EmptyListState = "nothing-recorded" | "filtered-out";

export function emptyListState(totalLoaded: number, filtering: boolean): EmptyListState {
  return filtering && totalLoaded > 0 ? "filtered-out" : "nothing-recorded";
}
