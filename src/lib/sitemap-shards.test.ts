import { describe, expect, it } from "vitest";

import { SITEMAP_URLS_PER_SHARD, sitemapShard, sitemapShardCount } from "./sitemap-shards";

describe("sitemap URL sharding", () => {
  it("uses no child shard when there are no dynamic pages", () => {
    expect(sitemapShardCount([])).toBe(0);
    expect(sitemapShard([], 1)).toEqual([]);
  });

  it("keeps each shard under the configured URL limit", () => {
    const paths = Array.from({ length: SITEMAP_URLS_PER_SHARD + 3 }, (_, i) => "/gb/place-" + i);
    expect(sitemapShardCount(paths)).toBe(2);
    expect(sitemapShard(paths, 1)).toHaveLength(SITEMAP_URLS_PER_SHARD);
    expect(sitemapShard(paths, 2)).toEqual(paths.slice(SITEMAP_URLS_PER_SHARD));
  });

  it("rejects invalid, fractional, and out-of-range shard numbers", () => {
    const paths = ["/gb/a", "/gb/b"];
    expect(sitemapShard(paths, 0)).toEqual([]);
    expect(sitemapShard(paths, -1)).toEqual([]);
    expect(sitemapShard(paths, 1.5)).toEqual([]);
    expect(sitemapShard(paths, Number.NaN)).toEqual([]);
    expect(sitemapShard(paths, 100)).toEqual([]);
  });
});
