import { DataError } from "./data/errors";
import type { WorldEntry } from "./world-data";

export interface LocalityEntryLoadResult {
  entries: WorldEntry[];
  scopeTooWide: boolean;
}

function isScopeTooWide(error: unknown): boolean {
  if (error instanceof DataError && error.code === "SCOPE_TOO_WIDE") return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SCOPE_TOO_WIDE"
  );
}

/** A wide locality remains navigable without falsely presenting it as empty. */
export async function loadLocalityEntries(
  read: () => Promise<WorldEntry[]>,
): Promise<LocalityEntryLoadResult> {
  try {
    return { entries: await read(), scopeTooWide: false };
  } catch (error) {
    if (isScopeTooWide(error)) return { entries: [], scopeTooWide: true };
    throw error;
  }
}
