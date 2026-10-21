/**
 * Server-side adapter for dynamic locality and service sitemaps.
 * Uses the canonical public world read and canonical place index only.
 * Any incomplete or failed scan returns no dynamic paths.
 */
import { fetchWorld } from "./listings";
import { loadPlaceIndex } from "./place-index.server";
import { publicServerClient } from "./supabase-public.server";
import {
  buildGatedPlaceSitemapPaths,
  type GatedPlaceSitemapPaths,
} from "./place-sitemap-candidates";
import type { WorldEntry } from "./world-data";

const PAGE_LIMIT = 200;
const MAX_SCAN_PAGES = 100;
const CACHE_TTL_MS = 15 * 60_000;
const ERROR_CACHE_TTL_MS = 30_000;

const EMPTY_PATHS: GatedPlaceSitemapPaths = {
  localityPaths: [],
  servicePaths: [],
};

interface Computation {
  paths: GatedPlaceSitemapPaths;
  complete: boolean;
}

let cached:
  | {
      expiresAt: number;
      pending: Promise<Computation>;
    }
  | undefined;

/**
 * Cache the fully validated result within a warm server process so a sitemap
 * index and its child shards do not each scan the entire public catalogue.
 * Cache misses are safe; this cache is an optimization, not a source of truth.
 */
export async function getGatedPlaceSitemapPaths(): Promise<GatedPlaceSitemapPaths> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return (await cached.pending).paths;

  const pending = computeGatedPlaceSitemapPaths();
  const entry = { expiresAt: now + ERROR_CACHE_TTL_MS, pending };
  cached = entry;
  const result = await pending;
  if (cached === entry) {
    entry.expiresAt = Date.now() + (result.complete ? CACHE_TTL_MS : ERROR_CACHE_TTL_MS);
  }
  return result.paths;
}

async function computeGatedPlaceSitemapPaths(): Promise<Computation> {
  try {
    const [index, entries] = await Promise.all([
      loadPlaceIndex(publicServerClient()),
      readAllPublicEntries(),
    ]);
    if (!entries) return { paths: EMPTY_PATHS, complete: false };
    return { paths: buildGatedPlaceSitemapPaths(index, entries), complete: true };
  } catch {
    // Fixed public-screen sitemaps remain available if dynamic reads fail.
    // Unknown or incomplete data must never widen crawler exposure.
    return { paths: EMPTY_PATHS, complete: false };
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
