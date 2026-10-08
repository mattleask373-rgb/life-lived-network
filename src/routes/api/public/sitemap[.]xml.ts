import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Sitemap index. Pages sitemap is always present.
 * Locality sitemap is registered so crawlers can discover it; the child
 * itself lists zero URLs until inventory proof exists (no empty shells).
 */
export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          sitemapIndexXml([
            "/api/public/sitemap-pages.xml",
            "/api/public/sitemap-localities.xml",
          ]),
          { headers: XML_HEADERS },
        ),
    },
  },
});
