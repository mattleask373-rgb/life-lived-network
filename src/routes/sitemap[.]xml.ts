import { createFileRoute } from "@tanstack/react-router";

import { PUBLIC_PATHS, sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Dynamic sitemap.xml. Prefer this over platform defaults or missing static
 * public/ when those are overridden or not yet published. Lists only existing
 * PUBLIC_PATHS; no fabricated pages.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(sitemapXml(PUBLIC_PATHS.map((path) => ({ path }))), {
          headers: XML_HEADERS,
        }),
    },
  },
});
