import { createFileRoute } from "@tanstack/react-router";

import { localitySitemapUrls } from "@/lib/locality-sitemap";
import { sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Locality child sitemap. Only places with enough real (non-demonstration)
 * canonical entries are listed. Empty shells are never emitted.
 *
 * Data source is injected via server handler context once a durable place
 * inventory reader exists; until then this returns an empty but valid urlset
 * rather than inventing localities.
 */
export const Route = createFileRoute("/api/public/sitemap-localities.xml")({
  server: {
    handlers: {
      GET: async () => {
        // HOSTED / inventory reader: when a proven place+entry-count source
        // is available, map it through localitySitemapUrls. Until then:
        // empty set — UNKNOWN inventory, not fabricated places.
        const candidates: Parameters<typeof localitySitemapUrls>[0] = [];
        const xml = sitemapXml(localitySitemapUrls(candidates));
        return new Response(xml, { headers: XML_HEADERS });
      },
    },
  },
});
