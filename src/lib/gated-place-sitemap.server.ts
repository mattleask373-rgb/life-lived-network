/**
 * Server-side adapter for dynamic locality and service sitemaps.
 * Uses the canonical public world read and canonical place index only.
 * Any incomplete or failed scan returns no dynamic paths.
 */
import { fetchWorld } from "./listings";
import { loadPlaceIndex } from "./place-index.server";
import { publicServerClient } from "./supabase-public.server";
import { buildGatedPlaceSitemapPaths, type GatedPlaceSitemapPaths } from "./place-sitemap-candidates";
import type { WorldEntry } from "./world-data";

const PAGE_LIMIT = 200;
const MAX_SCAN_PAGES = 100;

const EMPTY_PATHS: GatedPlaceSitemapPaths = {
  localityPaths: [],
  servicePaths: [],
};

export async function getGatedPlaceSitemapPaths(): Promise<GatedPlaceSitemapPaths> {
  try {
    const [index, entries] = await Promise.all([
      loadPlaceIndex(publicServerClient()),
      readAllPublicEntries(),
    ]);
    if (!entries) return EMPTY_PATHS;
    return buildGatedPlaceSitemapPaths(index, entries);
  } catch {
    // Fixed public-screen sitemaps remain available if dynamic reads fail.
    // Unknown or incomplete data must never widen crawler exposure.
    return EMPTY_PATHS;
  }
}

async function readAllPublicEntries(): Promise<WorldEntry[] | null> {
  const entries: WorldEntry[] = [];
  let cursor: string | null = null;

  for (let pageNumber = 0; pageNumber < MAX_SCAN_PAGES; pageNumber += 1) {
    const page = await fetchWorld({ limit: PAGE_LIMIT, cursor });
    entries.push(...page.items);
    if (!page.hasMore) return entries;
    if (!page.nextCursor || page.nextCursor === cursor) return null;
    cursor = page.nextCursor;
  }

  return null;
}
