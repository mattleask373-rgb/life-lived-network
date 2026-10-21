import { createFileRoute } from "@tanstack/react-router";

import { PUBLIC_SITEMAP_CHILD_PATHS, sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * The sitemap index. It names the public page and eligible-locality child
 * and service-in-place pages that pass their shared evidence gates. Provider and
 * event sitemaps can join as those pages become genuinely useful.
 */
export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          sitemapIndexXml(PUBLIC_SITEMAP_CHILD_PATHS),
          { headers: XML_HEADERS },
        ),
    },
  },
});
