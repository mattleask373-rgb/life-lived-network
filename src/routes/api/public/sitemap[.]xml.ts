import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * The sitemap index. It names the public page and eligible-locality child
 * sitemaps; service, provider and event sitemaps join it as those pages become
 * genuinely useful. Nothing empty is ever listed.
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
