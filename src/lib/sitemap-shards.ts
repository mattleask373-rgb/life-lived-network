/** Keep every generated sitemap comfortably below the protocol's URL-count ceiling. */
export const SITEMAP_URLS_PER_SHARD = 40_000;

export function sitemapShardCount(paths: readonly string[]): number {
  return Math.ceil(paths.length / SITEMAP_URLS_PER_SHARD);
}

/** Shards are one-based in URLs. Invalid shard requests fail closed to no paths. */
export function sitemapShard(paths: readonly string[], oneBasedShard: number): string[] {
  if (!Number.isSafeInteger(oneBasedShard) || oneBasedShard < 1) return [];
  const start = (oneBasedShard - 1) * SITEMAP_URLS_PER_SHARD;
  if (start >= paths.length) return [];
  return paths.slice(start, start + SITEMAP_URLS_PER_SHARD);
}
