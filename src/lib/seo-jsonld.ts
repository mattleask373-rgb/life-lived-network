/**
 * Truthful JSON-LD helpers for public pages.
 *
 * Never invent ratings, reviews, inventory, or local claims.
 * Only emit structured data that the page itself can support with real fields.
 */

import { SITE_ORIGIN, absoluteUrl } from "./seo";

export type JsonLd = Record<string, unknown>;

export function websiteJsonLd(opts?: { name?: string; description?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts?.name ?? "Life Lived Network",
    url: SITE_ORIGIN,
    ...(opts?.description ? { description: opts.description } : {}),
  };
}

export function organizationJsonLd(opts?: {
  name?: string;
  url?: string;
  logo?: string;
}): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts?.name ?? "Life Lived Network",
    url: opts?.url ?? SITE_ORIGIN,
  };
  if (opts?.logo) node.logo = opts.logo;
  return node;
}

export type BreadcrumbCrumb = Readonly<{ name: string; path: string }>;

/** BreadcrumbList only when every crumb has a real name and path. */
export function breadcrumbJsonLd(crumbs: readonly BreadcrumbCrumb[]): JsonLd | null {
  if (crumbs.length === 0) return null;
  for (const c of crumbs) {
    if (!c.name.trim() || !c.path.trim()) return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Serialize one or more nodes for a <script type="application/ld+json"> tag. */
export function jsonLdScriptContent(nodes: readonly JsonLd[]): string {
  if (nodes.length === 1) return JSON.stringify(nodes[0]);
  return JSON.stringify(nodes);
}
