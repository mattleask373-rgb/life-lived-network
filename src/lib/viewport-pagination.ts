import type { Page } from "./data/contract";

export const MAX_VIEWPORT_PAGES = 5;

/**
 * Combine cursor pages without duplicate IDs if records move between requests.
 * The latest instance of a duplicate wins while its first-seen list position is
 * retained, keeping pins/list stable between incremental reads.
 */
export function combineViewportPages<T extends { id: string }>(pages: readonly Page<T>[]): Page<T> {
  const order: string[] = [];
  const byId = new Map<string, T>();

  for (const page of pages) {
    for (const item of page.items) {
      if (!byId.has(item.id)) order.push(item.id);
      byId.set(item.id, item);
    }
  }

  const lastPage = pages.at(-1);
  return {
    items: order.map((id) => byId.get(id)!),
    nextCursor: lastPage?.nextCursor ?? null,
    hasMore: lastPage?.hasMore ?? false,
  };
}

/** Keep each viewport read bounded; over-wide views should be narrowed instead. */
export function canLoadMoreViewportPages(
  loadedPages: number,
  hasMore: boolean,
  maximumPages = MAX_VIEWPORT_PAGES,
): boolean {
  return hasMore && loadedPages < maximumPages;
}
