import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Dynamic sitemap.xml index. Child sitemaps expose the fixed public screens
 * and only locality pages that currently pass the shared indexability gate.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          sitemapIndexXml(["/api/public/sitemap-pages.xml", "/api/public/sitemap-localities.xml"]),
          { headers: XML_HEADERS },
        ),
    },
  },
});
