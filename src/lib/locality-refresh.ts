/**
 * The locality refresh UI delegates to the canonical route loader.
 * It does not fetch a parallel inventory or infer source freshness.
 */
export type LocalityRefreshResult = "checked" | "error";

export async function checkForLocalityUpdates(
  invalidate: () => Promise<unknown>,
): Promise<LocalityRefreshResult> {
  try {
    await invalidate();
    return "checked";
  } catch {
    return "error";
  }
}
