/**
 * Which demonstration records may join a real page of results.
 *
 * The policy gate comes first and is absolute: when fixtures are not allowed
 * (production), nothing is returned, whatever locality is being looked at.
 * When allowed, a selected locality only borrows its own demonstration
 * records; no selection means the whole demonstration layer.
 */
export function demoEntriesFor<T extends { placeSlug: string }>(
  entries: readonly T[],
  slugs: ReadonlySet<string>,
  allowed: boolean,
): T[] {
  if (!allowed) return [];
  return slugs.size ? entries.filter((e) => slugs.has(e.placeSlug)) : [...entries];
}
