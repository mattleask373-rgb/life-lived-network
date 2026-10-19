/**
 * What an empty discovery list should say. A filter that hides everything is
 * not the same as a place with nothing recorded, and must not claim it is.
 *
 * The home status line has the same rule for open needs: a failed or unfinished
 * read is not "0 open needs".
 */
export type EmptyListState = "nothing-recorded" | "filtered-out";

export function emptyListState(totalLoaded: number, filtering: boolean): EmptyListState {
  return filtering && totalLoaded > 0 ? "filtered-out" : "nothing-recorded";
}

export function homeRecordedStatus(input: {
  checking: boolean;
  worldFailed: boolean;
  recorded: number;
  openNeeds: number | null;
  needsFailed: boolean;
}): string {
  if (input.checking) return "Checking what's recorded here…";
  if (input.worldFailed) return "We couldn't check what's recorded here.";
  const things = input.recorded === 1 ? "1 thing" : `${input.recorded} things`;
  const needs = input.needsFailed
    ? "open needs couldn't be checked"
    : input.openNeeds === null
      ? "still checking open needs"
      : input.openNeeds === 1
        ? "1 open need"
        : `${input.openNeeds} open needs`;
  return `${things} recorded here · ${needs}`;
}
