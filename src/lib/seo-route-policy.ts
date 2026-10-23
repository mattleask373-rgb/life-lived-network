/**
 * Shared public/private route policy used by page metadata, robots.txt,
 * static/generated sitemaps and the read-only deployed SEO smoke checker.
 * Keep this module free of runtime/environment-dependent behavior.
 */
import { SERVICE_SITEMAP_SHARD_PATHS } from "./sitemap-shards";

export const PUBLIC_SITEMAP_CHILD_PATHS: readonly string[] = [
  "/api/public/sitemap-pages.xml",
  "/api/public/sitemap-localities.xml",
  ...SERVICE_SITEMAP_SHARD_PATHS,
];

export const PUBLIC_PATHS: readonly string[] = ["/", "/journey", "/road-trip", "/give", "/make"];

/**
 * These pages must not be indexed, but crawlers must be able to fetch their
 * robots metadata. A robots.txt Disallow is not a substitute for noindex.
 */
export const NOINDEX_PATHS: readonly string[] = ["/life-list"];

/** Routes intentionally disallowed to crawlers. This is not access control. */
export const PRIVATE_PATHS: readonly string[] = [
  "/auth",
  "/profile",
  "/conversations",
  "/need",
  "/help",
  "/moderation",
  "/sources",
  "/memories",
  "/partners",
  "/partner-tracker",
  "/earn",
];
