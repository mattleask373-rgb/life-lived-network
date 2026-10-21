import { createFileRoute } from "@tanstack/react-router";

import { sitemapIndexXml, XML_HEADERS } from "@/lib/seo";

/**
 * Dynamic sitemap.xml. Prefer this over platform defaults or missing static
 * public/ when those are overridden or not yet published. Lists only existing
 * PUBLIC_PATHS; no fabricated pages.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(\n          sitemapIndexXml(["/api/public/sitemap-pages.xml", "/api/public/sitemap-localities.xml"]),\n          {
          headers: XML_HEADERS,
        }),
    },
  },
});
