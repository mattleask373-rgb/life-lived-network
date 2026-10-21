import type { WorldEntry } from "@/lib/world-data";
import { sourceLastCheckedLabel } from "@/lib/freshness-label";

/** Displays only a real imported-record check timestamp; never labels demo/user posts. */
export function SourceLastChecked({ entry }: { entry: WorldEntry }) {
  if (
    entry.demonstration ||
    (entry.origin !== "source" && entry.origin !== "confirmed") ||
    !entry.lastCheckedAt
  ) {
    return null;
  }

  const label = sourceLastCheckedLabel(entry.lastCheckedAt);
  if (!label) return null;

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      <span>Source last checked </span>
      <time dateTime={entry.lastCheckedAt}>{label}</time>
    </p>
  );
}
