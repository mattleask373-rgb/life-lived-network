import { createFileRoute } from "@tanstack/react-router";

import { fetchPublicLocalitySitemapPaths } from "@/lib/locality-sitemap.server";
import { sitemapXml, XML_HEADERS } from "@/lib/seo";

/**
 * Only localities whose current rendered first page passes the existing
 * three-genuine-record indexability gate. The server reader uses anonymous
 * public RLS and fails closed when its bounded scan cannot be complete.
 */
export const Route = createFileRoute("/api/public/sitemap-localities.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const paths = await fetchPublicLocalitySitemapPaths();
          return new Response(
            sitemapXml(paths.map((path) => ({ path, changeFrequency: "weekly" as const }))),
            { headers: XML_HEADERS },
          );
        } catch {
          // Do not emit a stale or guessed list when the public source cannot
          // be read. Crawlers can retry a 503; uncertainty never becomes SEO.
          return new Response("Locality sitemap temporarily unavailable", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
