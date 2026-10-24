import { PRIVATE_PATHS, PUBLIC_SITEMAP_CHILD_PATHS } from "./seo-route-policy";
import { robotsTxt, SITE_ORIGIN, sitemapIndexXml } from "./seo";

export const DEFAULT_PUBLIC_SITE_ORIGIN = SITE_ORIGIN;

export interface SeoStaticAssets {
  robots: string;
  sitemap: string;
}

/** Validate the canonical public origin before it is written into crawler-facing files. */
export function validatePublicSiteOrigin(value?: string): string {
  const candidate = value?.trim() || DEFAULT_PUBLIC_SITE_ORIGIN;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("VITE_SITE_ORIGIN must be a valid absolute HTTPS origin.");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    (parsed.pathname !== "/" && parsed.pathname !== "") ||
    parsed.search ||
    parsed.hash ||
    candidate.includes("?") ||
    candidate.includes("#")
  ) {
    throw new Error(
      "VITE_SITE_ORIGIN must be an HTTPS origin without credentials, path, query or fragment.",
    );
  }
  return parsed.origin;
}

/** Render both static crawler files from the shared route registry and canonical origin. */
export function renderSeoStaticAssets(originValue?: string): SeoStaticAssets {
  const origin = validatePublicSiteOrigin(originValue);
  const robots = robotsTxt(origin);
  const sitemap = sitemapIndexXml(PUBLIC_SITEMAP_CHILD_PATHS, origin);

  for (const path of PRIVATE_PATHS) {
    if (!robots.includes("Disallow: " + path)) {
      throw new Error("Generated robots policy is missing a private-route rule.");
    }
  }
  if (robots.includes("Disallow: /life-list")) {
    throw new Error(
      "The noindex life list must remain crawlable so crawlers can read its metadata.",
    );
  }
  if (!robots.includes("Sitemap: " + origin + "/sitemap.xml")) {
    throw new Error("Generated robots policy is missing its canonical sitemap directive.");
  }
  if (
    !sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>') ||
    !sitemap.includes("<sitemapindex")
  ) {
    throw new Error("Generated sitemap index is not valid sitemap XML.");
  }
  for (const path of PUBLIC_SITEMAP_CHILD_PATHS) {
    if (!sitemap.includes("<loc>" + origin + path + "</loc>")) {
      throw new Error("Generated sitemap index is missing an expected child route.");
    }
  }
  return { robots, sitemap };
}
