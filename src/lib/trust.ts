import type { WorldEntry } from "@/lib/world-data";

/**
 * One plain-language trust state per entry, derived only from recorded
 * provenance. Never upgrades unknown to checked.
 */
export type TrustState = "demonstration" | "stale" | "checked" | "confirmed" | "unchecked";

export const TRUST_LABEL: Record<TrustState, string> = {
  demonstration: "Demonstration",
  stale: "May have changed",
  checked: "Checked",
  confirmed: "Confirmed by people here",
  unchecked: "Not yet checked",
};

type TrustInput = Pick<WorldEntry, "demonstration" | "quality" | "verified" | "origin">;

export function trustState(e: TrustInput): TrustState {
  if (e.demonstration) return "demonstration";
  if (e.quality === "expired" || e.quality === "may have changed") return "stale";
  if (e.quality === "verified" || e.quality === "recently updated") return "checked";
  if (e.quality === "community confirmed" || e.origin === "confirmed") return "confirmed";
  if (e.quality === "unverified") return "unchecked";
  return e.verified ? "checked" : "unchecked";
}

/** What the first view should push a person towards, from real counts only. */
export type Density = "quiet" | "sparse" | "busy";
export function densityOf(count: number): Density {
  if (count <= 0) return "quiet";
  return count < 8 ? "sparse" : "busy";
}
