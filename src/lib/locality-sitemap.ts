/**
 * Locality sitemap builder — only proven indexable places.
 * Aligns with public locality API meta.indexable (real entries >= 3).
 * Never lists empty shells or demonstration-only localities.
 */

import type { SitemapUrl } from "./seo";
import { localityPath } from "./public-locality-api";

export type LocalitySitemapCandidate = Readonly<{
  countrySegment: string;
  slug: string;
  /** Non-demonstration entry count from canonical discovery. */
  realEntryCount: number;
  lastModified?: string;
}>;

const INDEXABLE_MIN_REAL_ENTRIES = 3;

export function isLocalityIndexable(realEntryCount: number): boolean {
  return realEntryCount >= INDEXABLE_MIN_REAL_ENTRIES;
}

/**
 * Build sitemap URL rows for localities that pass the indexability bar.
 * Thin / demo-only places are omitted (not listed with noindex — simply absent).
 */
export function localitySitemapUrls(
  candidates: readonly LocalitySitemapCandidate[],
): SitemapUrl[] {
  const seen = new Set<string>();
  const urls: SitemapUrl[] = [];

  for (const c of candidates) {
    if (!isLocalityIndexable(c.realEntryCount)) continue;
    if (!c.slug?.trim() || !c.countrySegment?.trim()) continue;

    const path = localityPath({
      countrySegment: c.countrySegment,
      slug: c.slug,
    });
    if (seen.has(path)) continue;
    seen.add(path);

    urls.push({
      path,
      changeFrequency: "weekly",
      ...(c.lastModified ? { lastModified: c.lastModified } : {}),
    });
  }

  return urls;
}
