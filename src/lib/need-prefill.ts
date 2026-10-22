import { parseQuerySearch, type QuerySearch } from "./search-context";

const MAX_CATEGORY_LENGTH = 100;

/** Query-driven prefill only. These values remain editable drafts until submission. */
export interface NeedSearch extends QuerySearch {
  category?: string;
}

export function parseNeedSearch(raw: Record<string, unknown>): NeedSearch {
  const parsed = parseQuerySearch(raw);
  const category =
    typeof raw.category === "string"
      ? raw.category.trim().replace(/\s+/g, " ").slice(0, MAX_CATEGORY_LENGTH)
      : "";
  return { ...parsed, ...(category ? { category } : {}) };
}
