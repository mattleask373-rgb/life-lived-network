/**
 * The public face of The Living World.
 *
 * One place decides what a public page tells a search engine, so no page
 * invents its own rules. Two things matter here:
 *
 *   CANONICAL URL  the single address a page should be known by. Tracking
 *                  parameters, filters and alternate forms all point back here.
 *   INDEXABILITY   whether a page is genuinely useful enough to be listed.
 *                  Private and internal screens always say no.
 *
 * Nothing here writes marketing copy or invents local claims. It only carries
 * what a page already truthfully shows.
 */

/**
 * The origin the public site is served from. Set VITE_SITE_ORIGIN when the site
 * moves to its own domain; until then the published Lovable address is correct.
 */
export const SITE_ORIGIN: string = (() => {
  const configured =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.["VITE_SITE_ORIGIN"] as string | undefined)
      : undefined;
  const origin = configured?.trim() || "https://life-lived-network.lovable.app";
  return origin.replace(/\/+$/, "");
})();

/** A path made absolute and stripped of query strings, fragments and duplicate slashes. */
export function absoluteUrl(path: string): string {
  const clean = (path.split("#")[0] ?? "").split("?")[0] ?? "";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  const collapsed = withSlash.replace(/\/{2,}/g, "/");
  const trimmed = collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : "/";
  return `${SITE_ORIGIN}${trimmed}`;
}

export interface PageMeta {
  /** The canonical path, e.g. "/road-trip". */
  path: string;
  title: string;
  description: string;
  /** Absolute https image URL, only when the page itself shows it. */
  image?: string;
}

type MetaTag = Record<string, string>;
type LinkTag = Record<string, string>;

/**
 * Metadata for a page that should be found. Canonical is always emitted, so
 * shared links with campaign parameters never become a second address.
 */
export function publicPage(meta: PageMeta): { meta: MetaTag[]; links: LinkTag[] } {
  const tags: MetaTag[] = [
    { title: meta.title },
    { name: "description", content: meta.description },
    { property: "og:title", content: meta.title },
    { property: "og:description", content: meta.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: absoluteUrl(meta.path) },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "index, follow" },
  ];
  if (meta.image) {
    tags.push({ property: "og:image", content: meta.image });
    tags.push({ name: "twitter:image", content: meta.image });
  }
  return { meta: tags, links: [{ rel: "canonical", href: absoluteUrl(meta.path) }] };
}

/**
 * Metadata for a page that should not be found: anything behind a sign-in,
 * anything personal, and anything internal.
 */
export function privatePage(meta: Omit<PageMeta, "image">): {
  meta: MetaTag[];
  links: LinkTag[];
} {
  return {
    meta: [
      { title: meta.title },
      { name: "description", content: meta.description },
      { property: "og:title", content: meta.title },
      { property: "og:description", content: meta.description },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [],
  };
}

/** Public app screens that exist today. Locality and service pages arrive later. */
export const PUBLIC_PATHS: readonly string[] = [
  "/",
  "/journey",
  "/road-trip",
  "/life-list",
  "/give",
  "/make",
];

/** Screens that must never be crawled: personal, private or internal. */
export const PRIVATE_PATHS: readonly string[] = [
  "/auth",
  "/profile",
  "/conversations",
  "/need",
  "/help",
  "/moderation",
  "/sources",
];

export interface SitemapUrl {
  path: string;
  /** ISO date, only when genuinely known. */
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A urlset document. Only canonical, indexable paths belong in here. */
export function sitemapXml(urls: SitemapUrl[]): string {
  const entries = urls
    .map((url) => {
      const parts = [`    <loc>${escapeXml(absoluteUrl(url.path))}</loc>`];
      if (url.lastModified) parts.push(`    <lastmod>${escapeXml(url.lastModified)}</lastmod>`);
      if (url.changeFrequency)
        parts.push(`    <changefreq>${escapeXml(url.changeFrequency)}</changefreq>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

/** A sitemap index, so locality, service, provider and event sitemaps can be added without churn. */
export function sitemapIndexXml(paths: string[]): string {
  const entries = paths
    .map((path) => `  <sitemap>\n    <loc>${escapeXml(absoluteUrl(path))}</loc>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
};
