import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * The sitemap index. It names one child sitemap today; locality, service,
 * provider and event sitemaps join it as those pages become genuinely useful.
 * Nothing empty is ever listed.
 */
export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(sitemapIndexXml(["/api/public/sitemap-pages.xml"]), {
          headers: XML_HEADERS,
        }),
    },
  },
});
