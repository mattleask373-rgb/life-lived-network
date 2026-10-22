/**
 * Google sitemap files have a finite URL-count limit. Keep the configured shard
 * size below that limit, and keep a fixed set of shard URLs so the static and
 * server-generated sitemap indexes stay identical on Lovable hosts.
 *
 * The current source scan is bounded at fewer than 5,000 places and the shared
 * taxonomy has 41 service categories. Eight 40,000-URL shards cover that
 * conservative place × category upper bound today. The regression test forces
 * this capacity to be revisited if those source-contract bounds grow.
 */
export const SITEMAP_URLS_PER_SHARD = 40_000;
export const MAX_SERVICE_SITEMAP_SHARDS = 8;

export const SERVICE_SITEMAP_SHARD_PATHS: readonly string[] = Array.from(
  { length: MAX_SERVICE_SITEMAP_SHARDS },
  (_, index) => `/api/public/sitemap-services/${index + 1}.xml`,
);

export function sitemapShardCount(paths: readonly string[]): number {
  return Math.ceil(paths.length / SITEMAP_URLS_PER_SHARD);
}

/**
 * Return a stable, one-based URL slice. null means invalid input or that the
 * current source would overflow the fixed index; callers must fail closed
 * rather than silently omit URLs.
 */
export function sitemapShard(paths: readonly string[], oneBasedShard: number): string[] | null {
  if (
    !Number.isSafeInteger(oneBasedShard) ||
    oneBasedShard < 1 ||
    oneBasedShard > MAX_SERVICE_SITEMAP_SHARDS
  ) {
    return null;
  }
  if (sitemapShardCount(paths) > MAX_SERVICE_SITEMAP_SHARDS) return null;

  const start = (oneBasedShard - 1) * SITEMAP_URLS_PER_SHARD;
  return paths.slice(start, start + SITEMAP_URLS_PER_SHARD);
}
