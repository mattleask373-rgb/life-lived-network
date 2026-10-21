import { describe, expect, it } from "vitest";

import {
  MAX_SERVICE_SITEMAP_SHARDS,
  SERVICE_SITEMAP_SHARD_PATHS,
  SITEMAP_URLS_PER_SHARD,
  sitemapShard,
  sitemapShardCount,
} from "./sitemap-shards";
import { LOCALITY_SITEMAP_PLACE_LIMIT } from "./locality-sitemap";
import { SERVICE_CATEGORIES } from "./service-taxonomy";

describe("bounded sitemap shards", () => {
  it("keeps fixed shard URLs and their capacity aligned", () => {
    expect(SERVICE_SITEMAP_SHARD_PATHS).toHaveLength(MAX_SERVICE_SITEMAP_SHARDS);
    expect(new Set(SERVICE_SITEMAP_SHARD_PATHS).size).toBe(MAX_SERVICE_SITEMAP_SHARDS);
    expect(SITEMAP_URLS_PER_SHARD * MAX_SERVICE_SITEMAP_SHARDS).toBeGreaterThanOrEqual(
      LOCALITY_SITEMAP_PLACE_LIMIT * SERVICE_CATEGORIES.length,
    );
  });

  it("calculates counts at the URL limit boundaries", () => {
    expect(sitemapShardCount([])).toBe(0);
    expect(sitemapShardCount(Array.from({ length: SITEMAP_URLS_PER_SHARD }, (_, i) => String(i))))
      .toBe(1);
    expect(
      sitemapShardCount(Array.from({ length: SITEMAP_URLS_PER_SHARD + 1 }, (_, i) => String(i))),
    ).toBe(2);
  });

  it("returns non-overlapping stable slices and empty valid shards", () => {
    const paths = Array.from({ length: SITEMAP_URLS_PER_SHARD + 2 }, (_, i) => `/gb/place-\${i}`);
    const first = sitemapShard(paths, 1);
    const second = sitemapShard(paths, 2);
    expect(first).toHaveLength(SITEMAP_URLS_PER_SHARD);
    expect(second).toEqual(paths.slice(SITEMAP_URLS_PER_SHARD));
    expect([...first!, ...second!]).toEqual(paths);
    expect(sitemapShard(paths, 3)).toEqual([]);
  });

  it("rejects invalid shard numbers instead of guessing", () => {
    const paths = ["/gb/a", "/gb/b"];
    for (const shard of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_SERVICE_SITEMAP_SHARDS + 1]) {
      expect(sitemapShard(paths, shard)).toBeNull();
    }
  });

  it("fails closed if path count outgrows the fixed sitemap index capacity", () => {
    const paths = Array.from(
      { length: SITEMAP_URLS_PER_SHARD * MAX_SERVICE_SITEMAP_SHARDS + 1 },
      (_, i) => `/gb/place-\${i}`,
    );
    expect(sitemapShardCount(paths)).toBe(MAX_SERVICE_SITEMAP_SHARDS + 1);
    expect(sitemapShard(paths, 1)).toBeNull();
    expect(sitemapShard(paths, MAX_SERVICE_SITEMAP_SHARDS)).toBeNull();
  });
});
