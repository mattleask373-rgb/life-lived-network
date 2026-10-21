import { createFileRoute } from "@tanstack/react-router";

import { PUBLIC_SITEMAP_CHILD_PATHS, sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Dynamic sitemap.xml index. Child sitemaps expose fixed public screens plus
 * locality and service pages that pass their shared indexability gates.
 */
export const Route = createFileRoute("/sitemap.xml")({
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
