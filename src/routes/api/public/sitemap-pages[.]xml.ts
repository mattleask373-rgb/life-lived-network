import { createFileRoute } from "@tanstack/react-router";

import { PUBLIC_PATHS, sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * The public app screens that exist today. Private and internal screens are
 * never listed, and no page appears here that a person would find empty.
 */
export const Route = createFileRoute("/api/public/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          sitemapXml(PUBLIC_PATHS.map((path) => ({ path, changeFrequency: "weekly" as const }))),
          { headers: XML_HEADERS },
        ),
    },
  },
});
