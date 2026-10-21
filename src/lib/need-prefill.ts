import { parseQuerySearch, type QuerySearch } from "./search-context";

const MAX_CATEGORY = 100;

/** Query-driven prefill only. These values are drafts, not saved or matched facts. */
export interface NeedSearch extends QuerySearch {
  category?: string;
}

export function parseNeedSearch(raw: Record<string, unknown>): NeedSearch {
  const parsed = parseQuerySearch(raw);
  const category =
    typeof raw.category === "string"
      ? raw.category.trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY)
      : "";
  return { ...parsed, ...(category ? { category } : {}) };
}
