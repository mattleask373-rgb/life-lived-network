import { parseQuerySearch, type QuerySearch } from "./search-context";

const MAX_CATEGORY = 100;
const MAX_PLACE_SLUG = 100;

/** Query-driven prefill only. These values are drafts, not saved or matched facts. */
export interface NeedSearch extends QuerySearch {
  category?: string;
  /** Canonical locality slug, resolved against the real place table before posting. */
  place?: string;
}

export function parseNeedSearch(raw: Record<string, unknown>): NeedSearch {
  const parsed = parseQuerySearch(raw);
  const category =
    typeof raw.category === "string"
      ? raw.category.trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY)
      : "";
  // Keep a bounded unresolved slug so the page can explain that the requested
  // place could not be found instead of silently reverting to the default place.
  const place =
    typeof raw.place === "string" ? raw.place.trim().toLowerCase().slice(0, MAX_PLACE_SLUG) : "";
  return {
    ...parsed,
    ...(category ? { category } : {}),
    ...(place ? { place } : {}),
  };
}

/** Build editable need-form prefill from a canonical service and locality. */
export function needPrefillForService(input: {
  categorySlug: string;
  categoryLabel: string;
  placeSlug: string;
  placeName: string;
}): NeedSearch {
  return parseNeedSearch({
    category: input.categorySlug,
    place: input.placeSlug,
    from: `Looking for ${input.categoryLabel.toLowerCase()} help in ${input.placeName}`,
  });
}
