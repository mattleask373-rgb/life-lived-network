/**
 * Locality presentation density classification.
 *
 * Deterministic, presentation-only classification derived strictly from the
 * count of canonical WorldEntry records available to the locality.
 *
 * Invariants:
 * - Pure presentation concern: never alters discovery, ranking, or truth.
 * - Unknown remains unknown; density is never faked or inflated.
 * - ZERO_SUPPLY / quiet remains an honest, first-class product state.
 */

export type LocalityDensity = "quiet" | "sparse" | "medium" | "dense";

export interface LocalityDensityConfig {
  density: LocalityDensity;
  /**
   * Tailwind height classes tailored to viewport density:
   * Compact on mobile for sparse places to keep signal and real entries above the fold;
   * Expansive on dense places for spatial exploration.
   */
  mapHeightClass: string;
  /** Whether multi-layer filtering is meaningful given recorded entries. */
  showLayerFilter: boolean;
  /** Whether the editorial activity/quiet signal should be given top visual prominence. */
  promoteSignal: boolean;
}

export function classifyLocalityDensity(count: number): LocalityDensity {
  if (count <= 0) return "quiet";
  if (count <= 2) return "sparse";
  if (count <= 5) return "medium";
  return "dense";
}

export function getLocalityDensityConfig(
  count: number,
  presentLayersCount = 0,
): LocalityDensityConfig {
  const density = classifyLocalityDensity(count);

  switch (density) {
    case "quiet":
      return {
        density: "quiet",
        mapHeightClass: "h-44 sm:h-56",
        showLayerFilter: false,
        promoteSignal: true,
      };
    case "sparse":
      return {
        density: "sparse",
        mapHeightClass: "h-48 sm:h-64 md:h-72",
        // Only show filter if more than one layer actually exists in canonical data
        showLayerFilter: presentLayersCount > 1,
        promoteSignal: true,
      };
    case "medium":
      return {
        density: "medium",
        mapHeightClass: "h-64 sm:h-80 md:h-[22rem]",
        showLayerFilter: presentLayersCount > 1,
        promoteSignal: false,
      };
    case "dense":
    default:
      return {
        density: "dense",
        mapHeightClass: "h-[54vh] min-h-80 sm:h-[30rem]",
        showLayerFilter: true,
        promoteSignal: false,
      };
  }
}
