import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Dynamic sitemap.xml index. Child sitemaps expose fixed public screens plus
 * locality and service pages that pass their shared indexability gates.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          sitemapIndexXml(["/api/public/sitemap-pages.xml", "/api/public/sitemap-localities.xml", "/api/public/sitemap-services.xml"]),
          { headers: XML_HEADERS },
        ),
    },
  },
});
