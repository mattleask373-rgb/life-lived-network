/**
 * Server-side data adapter for the dynamic place-page sitemap.
 * Uses the canonical public world read; there is no direct listings query or
 * alternative matcher. An incomplete bounded scan returns no dynamic paths.
 */
import { fetchWorld } from "./listings";
import { loadPlaceIndex } from "./place-index.server";
import { publicServerClient } from "./supabase-public.server";
import { buildGatedPlaceSitemapPaths } from "./place-sitemap-candidates";
import type { WorldEntry } from "./world-data";

const PAGE_LIMIT = 200;
const MAX_SCAN_PAGES = 100;

export async function getGatedPlaceSitemapPaths(): Promise<string[]> {
  const [index, entries] = await Promise.all([
    loadPlaceIndex(publicServerClient()),
    readAllPublicEntries(),
  ]);
  if (!entries) return [];
  return buildGatedPlaceSitemapPaths(index, entries);
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
